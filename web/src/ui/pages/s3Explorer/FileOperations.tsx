import { Suspense, useEffect, useRef, useState } from "react";
import { getCoreSync, useCoreState } from "core";
import { useEvt } from "evt/hooks";
import { stringifyS3Uri } from "core/tools/S3Uri";
import type { FileOperationConflict } from "core/usecases/s3ExplorerUiController";
import {
    S3FileOperationConflictDialog,
    S3FileOperations
} from "ui/shared/codex/S3FileOperations";
import { tss } from "tss";

export function FileOperations() {
    return (
        <Suspense>
            <FileOperationsInner />
        </Suspense>
    );
}

function FileOperationsInner() {
    const operations = useCoreState(
        "s3ExplorerUiController",
        "fileOperations_allProfiles"
    );
    const {
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();
    const [questions, setQuestions] = useState<
        { id: string; conflict: FileOperationConflict }[]
    >([]);
    const sequence = useRef(0);
    const { classes } = useStyles();
    useEvt(ctx => {
        evtS3ExplorerUiController.attach(
            data => data.action === "ask file operation conflict resolution",
            ctx,
            ({ conflict }) => {
                const id = `${conflict.operationId}-${sequence.current++}`;
                setQuestions(previous => [...previous, { id, conflict }]);
            }
        );
        // A pending confirmation must not keep a thunk waiting if this integration unmounts.
        ctx.evtDoneOrAborted.attachOnce(() => {
            questionsRef.current.forEach(({ conflict }) =>
                conflict.resolveResponse({ action: "cancel" })
            );
        });
    }, []);
    const questionsRef = useRef(questions);
    questionsRef.current = questions;
    useEffect(() => {
        const obsolete = questions.filter(
            ({ conflict }) =>
                !operations.some(
                    operation =>
                        operation.operationId === conflict.operationId &&
                        operation.isOngoing
                )
        );
        if (obsolete.length === 0) return;
        obsolete.forEach(({ conflict }) => {
            s3ExplorerUiController.cancelFileOperation({
                operationId: conflict.operationId
            });
            conflict.resolveResponse({ action: "cancel" });
        });
        setQuestions(previous =>
            previous.filter(question => !obsolete.includes(question))
        );
    }, [questions, operations]);
    const question = questions[0];
    return (
        <>
            <S3FileOperations
                className={classes.panel}
                operations={operations.map(operation => {
                    const sources =
                        operation.type === "rename"
                            ? [operation.s3Uri]
                            : operation.s3Uris;
                    const destination =
                        operation.type === "rename"
                            ? stringifyS3Uri({
                                  ...operation.s3Uri,
                                  keySegments: [
                                      ...operation.s3Uri.keySegments.slice(0, -1),
                                      operation.newBasename
                                  ]
                              })
                            : stringifyS3Uri(operation.destinationS3Uri);
                    return {
                        id: operation.operationId,
                        profileName: operation.profileName,
                        operation: operation.type,
                        name: sources
                            .map(source => source.keySegments.at(-1) ?? source.bucket)
                            .join(", "),
                        isDirectory:
                            sources.length === 1 && sources[0].isDelimiterTerminated,
                        destination,
                        phase: operation.phase,
                        percent: operation.completionPercent,
                        completedCount: operation.completedObjectCount,
                        totalCount: operation.totalObjectCount,
                        copiedSize: operation.copiedSize,
                        totalSize: operation.totalSize,
                        errors: [
                            ...new Set(
                                [
                                    operation.erroredErrorMessage,
                                    ...operation.objects.map(
                                        object => object.erroredErrorMessage
                                    )
                                ].filter(message => message !== undefined)
                            )
                        ]
                    };
                })}
                onCancel={operationId =>
                    s3ExplorerUiController.cancelFileOperation({ operationId })
                }
                onDismissCompleted={s3ExplorerUiController.flushFileOperations}
            />
            {question !== undefined && (
                <S3FileOperationConflictDialog
                    key={question.id}
                    isOpen
                    questionId={question.id}
                    kind={question.conflict.type}
                    operation={question.conflict.operationType}
                    name={question.conflict.sourceS3Uri.keySegments.at(-1) ?? ""}
                    source={stringifyS3Uri(question.conflict.sourceS3Uri)}
                    destination={stringifyS3Uri(question.conflict.destinationS3Uri)}
                    onResolve={response => {
                        setQuestions(previous =>
                            previous.filter(item => item.id !== question.id)
                        );
                        if (response.action === "cancel") {
                            question.conflict.resolveResponse({ action: "cancel" });
                        } else if (question.conflict.type === "directory") {
                            question.conflict.resolveResponse({
                                action: response.action === "proceed" ? "merge" : "skip",
                                doRememberChoice: response.doRememberChoice
                            });
                        } else {
                            question.conflict.resolveResponse({
                                action:
                                    response.action === "proceed" ? "overwrite" : "skip",
                                doRememberChoice: response.doRememberChoice
                            });
                        }
                    }}
                />
            )}
        </>
    );
}

const useStyles = tss.withName({ FileOperations }).create(() => ({
    panel: { flexShrink: 0 }
}));
