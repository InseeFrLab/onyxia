import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useEffect } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, getCoreSync } from "core";
import { Explorer, type ExplorerProps } from "./Explorer";
import { routes, useRoute } from "ui/routes";
import { routeGroup } from "./route";
import { Evt } from "evt";
import type { Param0 } from "tsafe";
import { useConst } from "powerhooks/useConst";
import { assert } from "tsafe/assert";
import { env } from "env";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { triggerBrowserDownload } from "ui/tools/triggerBrowserDonwload";
import { useTranslation } from "ui/i18n";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import CircularProgress from "@mui/material/CircularProgress";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";

const Page = withLoader({
    loader: enforceLogin,
    Component: FileExplorer
});
export default Page;

function FileExplorer() {
    const route = useRoute();
    assert(routeGroup.has(route));

    const { t } = useTranslation("FileExplorerEntry");

    const {
        isCurrentWorkingDirectoryLoaded,
        accessDenied_directoryPath,
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
        fileExplorer.initialize({
            directoryPath: route.params.path,
            viewMode: route.params.mode
        });
    }, []);

    const onRefresh = useConstCallback(() => fileExplorer.refreshCurrentDirectory());

    const onCreateNewEmptyDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateNewEmptyDirectory"]>) =>
            fileExplorer.createNewEmptyDirectory({
                basename
            })
    );

    const onDownloadItems = useConstCallback(
        async (params: Param0<ExplorerProps["onDownloadItems"]>) => {
            const { items } = params;

            const { url, filename } = await fileExplorer.getBlobUrl({
                s3Objects: items
            });

            triggerBrowserDownload({ url, filename });
        }
    );

    const onDeleteItems = useConstCallback(
        (params: Param0<ExplorerProps["onDeleteItems"]>) =>
            fileExplorer.bulkDelete({
                s3Objects: params.items
            })
    );

    const onCopyPath = useConstCallback(
        ({ path }: Param0<ExplorerProps["onCopyPath"]>) => {
            assert(currentWorkingDirectoryView !== undefined);
            return copyToClipboard(
                path.split(currentWorkingDirectoryView.directoryPath.split("/")[0])[1] //get the path to object without <bucket-name>
            );
        }
    );

    const { classes, cx, css } = useStyles();

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) {
            return;
        }
        routes[route.name]({
            ...route.params,
            path: currentWorkingDirectoryView.directoryPath,
            mode: viewMode
        }).push();
    });

    const evtExplorerAction = useConst(() => Evt.create<ExplorerProps["evtAction"]>());

    const onOpenFile = useConstCallback<ExplorerProps["onOpenFile"]>(({ basename }) => {
        //TODO use dataExplorer thunk
        if (
            basename.endsWith(".parquet") ||
            basename.endsWith(".csv") ||
            basename.endsWith(".json")
        ) {
            const { path } = route.params;

            assert(path !== undefined);

            routes
                .dataExplorer({
                    source: `s3://${path.replace(/\/*$/g, "")}/${basename}`
                })
                .push();
            return;
        }

        fileExplorer.getFileDownloadUrl({ basename }).then(window.open);
    });

    const onRequestFilesUpload = useConstCallback<ExplorerProps["onRequestFilesUpload"]>(
        ({ files }) =>
            fileExplorer.uploadFiles({
                files
            })
    );

    const onNavigate = useConstCallback<ExplorerProps["onNavigate"]>(
        ({ directoryPath }) => {
            if (directoryPath === "") {
                routes.fileExplorerEntry().push();
                return;
            }

            fileExplorer.changeCurrentDirectory({ directoryPath });
        }
    );

    if (!isCurrentWorkingDirectoryLoaded) {
        return (
            <div
                className={cx(
                    classes.root,
                    css({
                        justifyContent: "center",
                        alignItems: "center"
                    })
                )}
            >
                {(() => {
                    if (accessDenied_directoryPath !== undefined) {
                        return (
                            <>
                                <Text typo="body 1">
                                    You do not have read permission on s3://
                                    {accessDenied_directoryPath}
                                    with this S3 Profile.
                                </Text>
                                <Button {...routes.fileExplorerEntry().link}>
                                    Go Back
                                </Button>
                            </>
                        );
                    }

                    return <CircularProgress />;
                })()}
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <PageHeader
                mainIcon={customIcons.filesSvgUrl}
                title={t("page title - file explorer")}
                helpTitle={t("what this page is used for - file explorer")}
                helpContent={t("help content", {
                    docHref: env.S3_DOCUMENTATION_LINK,
                    accountTabLink: routes.account({ tabId: "storage" }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
            />

            <Explorer
                onRequestFilesUpload={onRequestFilesUpload}
                onCreateNewEmptyDirectory={onCreateNewEmptyDirectory}
                filesBeingUploaded={uploadProgress.s3FilesBeingUploaded}
                className={classes.explorer}
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
                onNavigate={onNavigate}
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
                isDirectoryPathBookmarked={undefined}
                onToggleIsDirectoryPathBookmarked={undefined}
            />
        </div>
    );
}

const useStyles = tss.withName({ FileExplorer }).create({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    },
    explorer: {
        overflow: "hidden",
        flex: 1,
        width: "100%"
    }
});
