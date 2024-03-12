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
import { useEvt } from "evt/hooks";
import { customIcons } from "ui/theme";
import { MyFilesDisabledDialog } from "./MyFilesDisabledDialog";
import { assert } from "tsafe/assert";

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
        pathMinDepth
    } = useCoreState("fileExplorer", "main");

    const { fileExplorer } = useCore().functions;

    const { evtFileExplorer } = useCore().evts;

    useEffect(() => {
        fileExplorer.setCurrentDirectory({ "directoryPath": route.params.path });
    }, [route.params.path]);

    useEvt(
        ctx => {
            evtFileExplorer.$attach(
                data =>
                    data.action !== "set directory path" ? null : [data.directoryPath],
                ctx,
                directoryPath =>
                    routes[route.name]({
                        ...route.params,
                        "path": directoryPath
                    }).replace()
            );
        },
        [evtFileExplorer]
    );

    const onNavigate = useConstCallback(
        ({ directoryPath }: Param0<ExplorerProps["onNavigate"]>) =>
            routes[route.name]({
                ...route.params,
                "path": directoryPath
            }).push()
    );

    const onRefresh = useConstCallback(() => fileExplorer.refreshCurrentDirectory());

    const onCreateDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateDirectory"]>) =>
            fileExplorer.create({
                "createWhat": "directory",
                basename
            })
    );

    const onDeleteItem = useConstCallback(
        ({ kind, basename }: Param0<ExplorerProps["onDeleteItem"]>) =>
            fileExplorer.delete({
                "deleteWhat": kind,
                basename
            })
    );

    const onCopyPath = useConstCallback(({ path }: Param0<ExplorerProps["onCopyPath"]>) =>
        copyToClipboard(path.split("/").slice(2).join("/"))
    );

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [currentWorkingDirectoryView === undefined]);

    const evtExplorerAction = useConst(() => Evt.create<ExplorerProps["evtAction"]>());

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const titleCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": 100,
            "scrollableElementRef": scrollableDivRef
        }),
        []
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": 50,
            "scrollableElementRef": scrollableDivRef
        }),
        []
    );

    const onOpenFile = useConstCallback<ExplorerProps["onOpenFile"]>(({ basename }) => {
        if (basename.endsWith(".parquet") || basename.endsWith(".csv")) {
            const { path } = route.params;

            assert(path !== undefined);

            routes
                .dataExplorer({
                    "source": `s3://${path.replace(/\/*$/g, "")}/${basename}`
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
                    "createWhat": "file",
                    "basename": file.name,
                    "blob": file
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
                    "docHref":
                        "https://docs.sspcloud.fr/onyxia-guide/stockage-de-donnees",
                    "accountTabLink": routes.account({ "tabId": "storage" }).link
                })}
                helpIcon="sentimentSatisfied"
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
                files={currentWorkingDirectoryView.files}
                directories={currentWorkingDirectoryView.directories}
                directoriesBeingCreated={
                    currentWorkingDirectoryView.directoriesBeingCreated
                }
                filesBeingCreated={currentWorkingDirectoryView.filesBeingCreated}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                onDeleteItem={onDeleteItem}
                onCreateDirectory={onCreateDirectory}
                onCopyPath={onCopyPath}
                scrollableDivRef={scrollableDivRef}
                pathMinDepth={pathMinDepth}
                onOpenFile={onOpenFile}
            />
        </div>
    );
}

export const { i18n } = declareComponentKeys<
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

const useStyles = tss.withName({ MyFiles }).create({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "explorer": {
        "overflow": "hidden",
        "flex": 1,
        "width": "100%"
    }
});
