import { useEffect } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, getCoreSync } from "core";
import {
    Explorer as HeadlessExplorer,
    type ExplorerProps as HeadlessExplorerProps
} from "../fileExplorer/Explorer";
import { routes } from "ui/routes";
import { Evt } from "evt";
import type { Param0 } from "tsafe";
import { useConst } from "powerhooks/useConst";
import { assert, type Equals } from "tsafe/assert";
import { triggerBrowserDownload } from "ui/tools/triggerBrowserDonwload";
import CircularProgress from "@mui/material/CircularProgress";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import { useStyles } from "tss";
import { getIconUrlByName } from "lazy-icons";
import {
    ConfirmBucketCreationAttemptDialog,
    type ConfirmBucketCreationAttemptDialogProps
} from "./ConfirmBucketCreationAttemptDialog";
import { useEvt } from "evt/hooks";

type Props = {
    className?: string;
    directoryPath: string;
    changeCurrentDirectory: (params: { directoryPath: string }) => void;
    bookmarkStatus:
        | {
              isBookmarked: false;
          }
        | {
              isBookmarked: true;
              isReadonly: boolean;
          };
    onToggleIsDirectoryPathBookmarked: () => void;
};

export function Explorer(props: Props) {
    const {
        evts: { evtFileExplorer }
    } = getCoreSync();

    const evtConfirmBucketCreationAttemptDialogOpen = useConst(() =>
        Evt.create<ConfirmBucketCreationAttemptDialogProps["evtOpen"]>()
    );

    useEvt(ctx => {
        evtFileExplorer.pipe(ctx).attach(
            data => data.action === "ask confirmation for bucket creation attempt",
            ({ bucket, createBucket }) =>
                evtConfirmBucketCreationAttemptDialogOpen.post({
                    bucket,
                    createBucket
                })
        );
    }, []);

    return (
        <>
            <Explorer_inner {...props} />
            <ConfirmBucketCreationAttemptDialog
                evtOpen={evtConfirmBucketCreationAttemptDialogOpen}
            />
        </>
    );
}

function Explorer_inner(props: Props) {
    const {
        className,
        directoryPath,
        changeCurrentDirectory,
        bookmarkStatus,
        onToggleIsDirectoryPathBookmarked
    } = props;

    const {
        isCurrentWorkingDirectoryLoaded,
        navigationError,
        commandLogsEntries,
        isNavigationOngoing,
        uploadProgress,
        currentWorkingDirectoryView,
        pathMinDepth,
        viewMode,
        shareView,
        isDownloadPreparing
    } = useCoreState("fileExplorer", "main");

    const evtIsSnackbarOpen = useConst(() => Evt.create(isDownloadPreparing));

    useEffect(() => {
        evtIsSnackbarOpen.state = isDownloadPreparing;
    }, [isDownloadPreparing]);

    const {
        functions: { fileExplorer }
    } = getCoreSync();

    useEffect(() => {
        fileExplorer.changeCurrentDirectory({
            directoryPath
        });
    }, [directoryPath]);

    const onRefresh = useConstCallback(() => fileExplorer.refreshCurrentDirectory());

    const onCreateNewEmptyDirectory = useConstCallback(
        ({ basename }: Param0<HeadlessExplorerProps["onCreateNewEmptyDirectory"]>) =>
            fileExplorer.createNewEmptyDirectory({
                basename
            })
    );

    const onDownloadItems = useConstCallback(
        async (params: Param0<HeadlessExplorerProps["onDownloadItems"]>) => {
            const { items } = params;

            const { url, filename } = await fileExplorer.getBlobUrl({
                s3Objects: items
            });

            triggerBrowserDownload({ url, filename });
        }
    );

    const onDeleteItems = useConstCallback(
        (params: Param0<HeadlessExplorerProps["onDeleteItems"]>) =>
            fileExplorer.bulkDelete({
                s3Objects: params.items
            })
    );

    const onCopyPath = useConstCallback(
        ({ path }: Param0<HeadlessExplorerProps["onCopyPath"]>) => {
            assert(currentWorkingDirectoryView !== undefined);
            return copyToClipboard(
                path.split(currentWorkingDirectoryView.directoryPath.split("/")[0])[1] //get the path to object without <bucket-name>
            );
        }
    );

    const evtExplorerAction = useConst(() =>
        Evt.create<HeadlessExplorerProps["evtAction"]>()
    );

    const onOpenFile = useConstCallback<HeadlessExplorerProps["onOpenFile"]>(
        ({ basename }) => {
            //TODO use dataExplorer thunk
            if (
                basename.endsWith(".parquet") ||
                basename.endsWith(".csv") ||
                basename.endsWith(".json")
            ) {
                routes
                    .dataExplorer({
                        source: `s3://${directoryPath.replace(/\/$/g, "")}/${basename}`
                    })
                    .push();
                return;
            }

            fileExplorer.getFileDownloadUrl({ basename }).then(window.open);
        }
    );

    const onRequestFilesUpload = useConstCallback<
        HeadlessExplorerProps["onRequestFilesUpload"]
    >(({ files }) =>
        fileExplorer.uploadFiles({
            files
        })
    );

    const { cx, css, theme } = useStyles();

    if (
        isCurrentWorkingDirectoryLoaded &&
        currentWorkingDirectoryView.directoryPath !== directoryPath
    ) {
        return (
            <div
                className={cx(
                    css({
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%"
                    }),
                    className
                )}
            >
                <CircularProgress />
            </div>
        );
    }

    if (!isCurrentWorkingDirectoryLoaded) {
        return (
            <div
                className={cx(
                    css({
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%"
                    }),
                    className
                )}
            >
                {(() => {
                    if (navigationError !== undefined) {
                        return (
                            <div
                                className={css({
                                    textAlign: "center"
                                })}
                            >
                                <Text typo="body 1">
                                    {(() => {
                                        switch (navigationError.errorCase) {
                                            case "access denied":
                                                return [
                                                    "You do not have read permission on s3://",
                                                    navigationError.directoryPath,
                                                    "with this S3 Profile"
                                                ].join(" ");
                                            case "no such bucket":
                                                return `The bucket ${navigationError.bucket} does not exist`;
                                            default:
                                                assert<
                                                    Equals<typeof navigationError, never>
                                                >(false);
                                        }
                                    })()}
                                </Text>
                                <Button
                                    startIcon={getIconUrlByName("ArrowBack")}
                                    className={css({
                                        marginTop: theme.spacing(3),
                                        display: "inline-block"
                                    })}
                                    onClick={() =>
                                        changeCurrentDirectory({ directoryPath: "" })
                                    }
                                >
                                    Go Back
                                </Button>
                            </div>
                        );
                    }

                    return <CircularProgress />;
                })()}
            </div>
        );
    }

    return (
        <>
            <HeadlessExplorer
                className={className}
                onRequestFilesUpload={onRequestFilesUpload}
                onCreateNewEmptyDirectory={onCreateNewEmptyDirectory}
                filesBeingUploaded={uploadProgress.s3FilesBeingUploaded}
                doShowHidden={false}
                directoryPath={currentWorkingDirectoryView.directoryPath}
                isNavigating={isNavigationOngoing}
                commandLogsEntries={commandLogsEntries}
                evtAction={evtExplorerAction}
                items={currentWorkingDirectoryView.items}
                isBucketPolicyFeatureEnabled={
                    currentWorkingDirectoryView.isBucketPolicyFeatureEnabled
                }
                changePolicy={fileExplorer.changePolicy}
                onNavigate={changeCurrentDirectory}
                onRefresh={onRefresh}
                onDeleteItems={onDeleteItems}
                onCopyPath={onCopyPath}
                pathMinDepth={pathMinDepth}
                onOpenFile={onOpenFile}
                viewMode={viewMode}
                onViewModeChange={fileExplorer.changeViewMode}
                shareView={shareView}
                onShareFileOpen={fileExplorer.openShare}
                onShareFileClose={fileExplorer.closeShare}
                onShareRequestSignedUrl={fileExplorer.requestShareSignedUrl}
                onChangeShareSelectedValidityDuration={
                    fileExplorer.changeShareSelectedValidityDuration
                }
                onDownloadItems={onDownloadItems}
                evtIsDownloadSnackbarOpen={evtIsSnackbarOpen}
                bookmarkStatus={bookmarkStatus}
                onToggleIsDirectoryPathBookmarked={onToggleIsDirectoryPathBookmarked}
            />
        </>
    );
}
