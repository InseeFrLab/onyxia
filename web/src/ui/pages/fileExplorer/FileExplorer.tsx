import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useEffect } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, useCore } from "core";
import { Explorer, type ExplorerProps } from "./Explorer";
import { routes } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { Evt } from "evt";
import type { Param0 } from "tsafe";
import { useConst } from "powerhooks/useConst";
import type { PageRoute } from "./route";
import { assert } from "tsafe/assert";
import { env } from "env";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { triggerBrowserDownload } from "ui/tools/triggerBrowserDonwload";
import { useTranslation } from "ui/i18n";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

export type Props = {
    route: PageRoute;
    className?: string;
};

const FileExplorer = withLoginEnforced((props: Props) => {
    const { className, route } = props;

    const { t } = useTranslation({ FileExplorer });

    const {
        isCurrentWorkingDirectoryLoaded,
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

    const { fileExplorer } = useCore().functions;

    useEffect(() => {
        fileExplorer.initialize({
            directoryPath: route.params.path,
            viewMode: route.params.mode
        });
    }, []);

    const onRefresh = useConstCallback(() => fileExplorer.refreshCurrentDirectory());

    const onCreateNewEmptyDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateNewEmptyDirectory"]>) =>
            fileExplorer.create({
                createWhat: "new empty directory",
                basename
            })
    );

    const onDeleteItem = useConstCallback(
        (params: Param0<ExplorerProps["onDeleteItem"]>) =>
            fileExplorer.delete({
                s3Object: params.item
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

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) {
            showSplashScreen({ enableTransparency: true });
        } else {
            hideSplashScreen();
        }
    }, [currentWorkingDirectoryView === undefined]);

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
            files.forEach(({ directoryRelativePath, basename, blob }) =>
                fileExplorer.create({
                    createWhat: "file",
                    directoryRelativePath,
                    basename,
                    blob
                })
            )
    );

    if (!isCurrentWorkingDirectoryLoaded) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
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
                onNavigate={fileExplorer.changeCurrentDirectory}
                onRefresh={onRefresh}
                onDeleteItem={onDeleteItem}
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
            />
        </div>
    );
});

export default FileExplorer;

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
