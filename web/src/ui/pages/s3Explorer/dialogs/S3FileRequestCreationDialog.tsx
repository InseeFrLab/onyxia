import type { Evt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import type { S3Uri } from "core/tools/S3Uri";
import { getCore, getCoreSync, useCoreState } from "core";
import { withLoader } from "ui/tools/withLoader";
import { routes } from "ui/routes";
import { S3FileRequestCreationDialog as S3FileRequestCreationDialog_headless } from "ui/shared/codex/S3FileRequestCreationDialog";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export type S3FileRequestCreationDialogProps = {
    evtOpen: Evt<{
        s3Uri: S3Uri.TerminatedByDelimiter;
        onCreateEmptyFolder: () => void;
    }>;
};

export function S3FileRequestCreationDialog(props: S3FileRequestCreationDialogProps) {
    return <S3FileRequestCreationDialogContainer {...props} />;
}

function S3FileRequestCreationDialogContainer(props: S3FileRequestCreationDialogProps) {
    const { evtOpen } = props;
    const [state, setState] = useState<
        UnpackEvt<S3FileRequestCreationDialogProps["evtOpen"]> | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, eventData => setState(eventData));
        },
        [evtOpen]
    );

    const { t } = useTranslation({ S3FileRequestCreationDialogContainer });

    return (
        <Dialog
            maxWidth="xl"
            title={t("dialog title")}
            body={
                state === undefined ? undefined : (
                    <Body
                        s3Uri={state.s3Uri}
                        onCreateEmptyFolder={() => {
                            setState(undefined);
                            state.onCreateEmptyFolder();
                        }}
                    />
                )
            }
            isOpen={state !== undefined}
            onClose={() => setState(undefined)}
            showCloseButton
        />
    );
}

const Body = withLoader<{
    s3Uri: S3Uri.TerminatedByDelimiter;
    onCreateEmptyFolder: () => void;
}>({
    loader: async ({ s3Uri }) => {
        const core = await getCore();

        await core.functions.s3FileRequestCreationUiController.load({ s3Uri });
    },
    FallbackComponent: () => null,
    Component: ({ onCreateEmptyFolder }) => {
        const mainView = useCoreState("s3FileRequestCreationUiController", "mainView");
        const {
            functions: { s3FileRequestCreationUiController }
        } = getCoreSync();

        const uploadPageUrl =
            mainView.presignedPost === undefined
                ? undefined
                : new URL(
                      routes.s3FileRequest({
                          presignedPost: mainView.presignedPost
                      }).link.href,
                      window.location.href
                  ).href;

        return (
            <S3FileRequestCreationDialog_headless
                folderName={mainView.folderName}
                isEmptyPrefix={mainView.isEmptyPrefix}
                validityDuration={mainView.validityDuration}
                maxObjectSize={mainView.maxObjectSize}
                uploadPageUrl={uploadPageUrl}
                errorMessage={mainView.errorMessage}
                changeValidityDuration={
                    s3FileRequestCreationUiController.changeValidityDuration
                }
                changeMaxObjectSize={
                    s3FileRequestCreationUiController.changeMaxObjectSize
                }
                retryGeneration={s3FileRequestCreationUiController.retryGeneration}
                createEmptyFolder={onCreateEmptyFolder}
            />
        );
    }
});

const { i18n } = declareComponentKeys<"dialog title">()({
    S3FileRequestCreationDialogContainer
});
export type I18n = typeof i18n;
