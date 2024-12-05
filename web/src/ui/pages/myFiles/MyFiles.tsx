import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useEffect, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, useCore } from "core";
import { Explorer } from "./Explorer";
import { ExplorerProps } from "./Explorer";
import { useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { Evt } from "evt";
import type { CollapseParams } from "onyxia-ui/CollapsibleWrapper";
import type { Param0 } from "tsafe";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { useConst } from "powerhooks/useConst";
import type { Link } from "type-route";
import type { PageRoute } from "./route";
import { assert } from "tsafe/assert";
import { env } from "env";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { MyFilesDisabledDialog } from "./MyFilesDisabledDialog";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyFilesMaybeDisabled(props: Props) {
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");
    if (!isFileExplorerEnabled) {
        return <MyFilesDisabledDialog />;
    }
    return <MyFiles {...props} />;
}

function MyFiles(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyFiles });

    const {
        isCurrentWorkingDirectoryLoaded,
        commandLogsEntries,
        isNavigationOngoing,
        uploadProgress,
        currentWorkingDirectoryView,
        pathMinDepth,
        viewMode,
        shareView
    } = useCoreState("fileExplorer", "main");

    const { fileExplorer } = useCore().functions;

    useEffect(() => {
        const { cleanup } = fileExplorer.initialize({
            directoryPath: route.params.path,
            viewMode: route.params.mode
        });
        return cleanup;
    }, []);

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) return;

        routes[route.name]({
            ...route.params,
            path: currentWorkingDirectoryView.directoryPath,
            mode: viewMode
        }).push();
    }, [currentWorkingDirectoryView?.directoryPath, viewMode]);

    const onRefresh = useConstCallback(() => fileExplorer.refreshCurrentDirectory());

    const onCreateDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateDirectory"]>) =>
            fileExplorer.create({
                createWhat: "directory",
                basename
            })
    );

    const onDeleteItem = useConstCallback(
        (params: Param0<ExplorerProps["onDeleteItem"]>) =>
            fileExplorer.delete({
                s3Object: params.item
            })
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

    const evtExplorerAction = useConst(() => Evt.create<ExplorerProps["evtAction"]>());

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const titleCollapseParams = useMemo(
        (): CollapseParams => ({
            behavior: "controlled",
            isCollapsed: false
            // "scrollTopThreshold": 100,
            // "scrollableElementRef": scrollableDivRef
        }),
        []
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            behavior: "controlled",
            //"scrollTopThreshold": 50,
            //"scrollableElementRef": scrollableDivRef,
            isCollapsed: true
        }),
        []
    );

    const onOpenFile = useConstCallback<ExplorerProps["onOpenFile"]>(({ basename }) => {
        //TODO use dataExplorer thunk
        if (basename.endsWith(".parquet") || basename.endsWith(".csv")) {
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

    const onFileSelected = useConstCallback<ExplorerProps["onFileSelected"]>(
        ({ files }) =>
            files.forEach(file =>
                fileExplorer.create({
                    createWhat: "file",
                    basename: file.name,
                    blob: file
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
                title={t("page title - my files")}
                helpTitle={t("what this page is used for - my files")}
                helpContent={t("help content", {
                    docHref: env.S3_DOCUMENTATION_LINK,
                    accountTabLink: routes.account({ tabId: "storage" }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <Explorer
                onFileSelected={onFileSelected}
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
                onCreateDirectory={onCreateDirectory}
                onCopyPath={onCopyPath}
                scrollableDivRef={scrollableDivRef}
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
            />
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "page title - my files"
    | "what this page is used for - my files"
    | {
          K: "help content";
          P: {
              docHref: string;
              accountTabLink: Link;
          };
          R: JSX.Element;
      }
>()({ MyFiles });
export type I18n = typeof i18n;

const useStyles = tss.withName({ MyFiles }).create({
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
