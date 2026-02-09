import { useEffect } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, getCoreSync } from "core";
import {
    Explorer as HeadlessExplorer,
    type ExplorerProps as HeadlessExplorerProps
} from "./headless/Explorer";
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
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { parseS3UriPrefix } from "core/tools/S3Uri";

type Props = {
    className?: string;
};

export function Explorer(props: Props) {
    const { className } = props;

    const {
        isCurrentWorkingDirectoryLoaded,
        navigationError,
        commandLogsEntries,
        isNavigationOngoing,
        uploadProgress,
        currentWorkingDirectoryView,
        viewMode,
        shareView,
        isDownloadPreparing,
        bookmarkStatus
    } = useCoreState("s3ExplorerUiController", "explorerView");

    const { t } = useTranslation("S3ExplorerExplorer");

    const evtIsSnackbarOpen = useConst(() => Evt.create(isDownloadPreparing));

    useEffect(() => {
        evtIsSnackbarOpen.state = isDownloadPreparing;
    }, [isDownloadPreparing]);

    const {
        functions: { s3ExplorerUiController }
    } = getCoreSync();

    const onRefresh = useConstCallback(() =>
        s3ExplorerUiController.refreshCurrentDirectory()
    );

    const onCreateNewEmptyDirectory = useConstCallback(
        ({ basename }: Param0<HeadlessExplorerProps["onCreateNewEmptyDirectory"]>) =>
            s3ExplorerUiController.createNewEmptyDirectory({
                basename
            })
    );

    const onDownloadItems = useConstCallback(
        async (params: Param0<HeadlessExplorerProps["onDownloadItems"]>) => {
            const { items } = params;

            const { url, filename } = await s3ExplorerUiController.getBlobUrl({
                s3Objects: items
            });

            triggerBrowserDownload({ url, filename });
        }
    );

    const onDeleteItems = useConstCallback(
        (params: Param0<HeadlessExplorerProps["onDeleteItems"]>) =>
            s3ExplorerUiController.bulkDelete({
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
            assert(isCurrentWorkingDirectoryLoaded);

            //TODO use dataExplorer thunk
            if (
                basename.endsWith(".parquet") ||
                basename.endsWith(".csv") ||
                basename.endsWith(".json")
            ) {
                routes
                    .dataExplorer({
                        source: `s3://${currentWorkingDirectoryView.directoryPath.replace(/\/$/g, "")}/${basename}`
                    })
                    .push();
                return;
            }

            s3ExplorerUiController.getFileDownloadUrl({ basename }).then(window.open);
        }
    );

    const onRequestFilesUpload = useConstCallback<
        HeadlessExplorerProps["onRequestFilesUpload"]
    >(({ files }) =>
        s3ExplorerUiController.uploadFiles({
            files
        })
    );

    const onNavigate = useConstCallback<HeadlessExplorerProps["onNavigate"]>(
        ({ directoryPath }) => {
            s3ExplorerUiController.setS3UriPrefixObjAndNavigate({
                s3UriPrefixObj: parseS3UriPrefix({
                    s3UriPrefix: `s3://${directoryPath}`,
                    strict: false
                })
            });
        }
    );

    const { cx, css, theme } = useStyles();

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
                                                return t("access denied", {
                                                    directoryPath:
                                                        navigationError.directoryPath
                                                });
                                            case "no such bucket":
                                                return t("bucket does not exist", {
                                                    bucket: navigationError.bucket
                                                });
                                            default:
                                                assert<
                                                    Equals<typeof navigationError, never>
                                                >(false);
                                        }
                                    })()}
                                </Text>
                                <div
                                    className={css({
                                        marginTop: theme.spacing(3),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: theme.spacing(2)
                                    })}
                                >
                                    <Button
                                        startIcon={getIconUrlByName("ArrowBack")}
                                        onClick={() =>
                                            s3ExplorerUiController.setS3UriPrefixObjAndNavigate(
                                                {
                                                    s3UriPrefixObj: undefined
                                                }
                                            )
                                        }
                                    >
                                        {t("go back")}
                                    </Button>
                                    {bookmarkStatus.isBookmarked &&
                                        !bookmarkStatus.isReadonly && (
                                            <Button
                                                startIcon={getIconUrlByName("Delete")}
                                                onClick={async () => {
                                                    s3ExplorerUiController.toggleIsDirectoryPathBookmarked();

                                                    s3ExplorerUiController.setS3UriPrefixObjAndNavigate(
                                                        {
                                                            s3UriPrefixObj: undefined
                                                        }
                                                    );
                                                }}
                                            >
                                                {t("delete bookmark")}
                                            </Button>
                                        )}
                                </div>
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
                changePolicy={s3ExplorerUiController.changePolicy}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                onDeleteItems={onDeleteItems}
                onCopyPath={onCopyPath}
                onOpenFile={onOpenFile}
                viewMode={viewMode}
                onViewModeChange={s3ExplorerUiController.changeViewMode}
                shareView={shareView}
                onShareFileOpen={s3ExplorerUiController.openShare}
                onShareFileClose={s3ExplorerUiController.closeShare}
                onShareRequestSignedUrl={s3ExplorerUiController.requestShareSignedUrl}
                onChangeShareSelectedValidityDuration={
                    s3ExplorerUiController.changeShareSelectedValidityDuration
                }
                onDownloadItems={onDownloadItems}
                evtIsDownloadSnackbarOpen={evtIsSnackbarOpen}
                bookmarkStatus={bookmarkStatus}
                onToggleIsDirectoryPathBookmarked={
                    s3ExplorerUiController.toggleIsDirectoryPathBookmarked
                }
            />
        </>
    );
}

const { i18n } = declareComponentKeys<
    | { K: "access denied"; P: { directoryPath: string } }
    | { K: "bucket does not exist"; P: { bucket: string } }
    | "go back"
    | "delete bookmark"
>()("S3ExplorerExplorer");

export type I18n = typeof i18n;
