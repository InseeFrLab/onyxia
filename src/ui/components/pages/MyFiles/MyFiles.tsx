import { makeStyles, PageHeader } from "ui/theme";
import { useEffect, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useSelector, useThunks, selectors } from "ui/coreApi";
import { Explorer } from "./Explorer";
import { ExplorerProps } from "./Explorer";
import { useTranslation } from "ui/i18n";
import Link from "@mui/material/Link";
import { routes } from "ui/routes";
import { createGroup } from "type-route";
import { useSplashScreen } from "onyxia-ui";
import type { Route } from "type-route";
import { Evt } from "evt";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper_legacy";
import type { Param0 } from "tsafe";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { useConst } from "powerhooks/useConst";

MyFiles.routeGroup = createGroup([routes.myFiles]);

type PageRoute = Route<typeof MyFiles.routeGroup>;

MyFiles.getDoRequireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

export function MyFiles(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyFiles });

    const currentWorkingDirectoryView = useSelector(
        selectors.fileExplorer.currentWorkingDirectoryView,
    ).currentWorkingDirectoryView;

    const { fileExplorerThunks } = useThunks();

    {
        const onNavigate = useConstCallback<
            Param0<typeof fileExplorerThunks["notifyThatUserIsWatching"]>["onNavigate"]
        >(({ directoryPath, doRestoreOpenedFile: _doRestoreOpenedFile }) =>
            routes[route.name]({
                "path": directoryPath,
                /* TODO: Restore when we have a fileViewer usecase
                 ...(!doRestoreOpenedFile
                     ? {}
                     : {
                         "openFile":
                             route.params.openFile ?? secretEditorState?.basename,
                     }),
                */
            }).replace(),
        );

        useEffect(() => {
            fileExplorerThunks.notifyThatUserIsWatching({
                "directNavigationDirectoryPath": route.params.path,
                onNavigate,
            });

            return () => fileExplorerThunks.notifyThatUserIsNoLongerWatching();
        }, [route.name]);
    }

    /* TODO: Restore when we have a fileViewer usecase
    useEffect(() => {
        if (route.params.path === undefined) {
            return;
        }

        if (route.params.openFile === undefined) {
            fileViewerThunks.closeSecret();
        } else {
            fileViewerThunks.openSecret({
                "directoryPath": route.params.path,
                "basename": route.params.openFile,
            });
        }
    }, [route.params.path, route.params.openFile]);
    */

    useEffect(() => {
        if (route.params.path === undefined) {
            return;
        }

        fileExplorerThunks.navigate({
            "directoryPath": route.params.path,
        });
    }, [route.params.path]);

    const onNavigate = useConstCallback(
        ({ directoryPath }: Param0<ExplorerProps["onNavigate"]>) =>
            routes[route.name]({ "path": directoryPath }).push(),
    );

    const onRefresh = useConstCallback(() => fileExplorerThunks.refresh());

    const onCreateDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateDirectory"]>) =>
            fileExplorerThunks.create({
                "createWhat": "directory",
                basename,
            }),
    );

    const onDeleteItem = useConstCallback(
        ({ kind, basename }: Param0<ExplorerProps["onDeleteItem"]>) =>
            fileExplorerThunks.delete({
                "deleteWhat": kind,
                basename,
            }),
    );

    const onCopyPath = useConstCallback(({ path }: Param0<ExplorerProps["onCopyPath"]>) =>
        copyToClipboard(path.split("/").slice(2).join("/")),
    );

    const s3ApiLogs = fileExplorerThunks.getS3ClientLogs();

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
            "scrollableElementRef": scrollableDivRef,
        }),
        [],
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": 50,
            "scrollableElementRef": scrollableDivRef,
        }),
        [],
    );

    const helpContent = useMemo(
        () => (
            <>
                {t("learn more - my files")}
                &nbsp;
                <Link
                    href="https://docs.sspcloud.fr/onyxia-guide/utiliser-des-variables-denvironnement"
                    target="_blank"
                    underline="hover"
                >
                    {t("read our documentation")}
                </Link>
            </>
        ),
        [t],
    );

    const onOpenFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: false }>["onOpenFile"]
    >(({ basename }) =>
        fileExplorerThunks.getFileDownloadUrl({ basename }).then(window.open),
    );

    const onFileSelected = useConstCallback<ExplorerProps["onFileSelected"]>(
        ({ files }) =>
            files.map(file =>
                fileExplorerThunks.create({
                    "createWhat": "file",
                    "basename": file.name,
                    "blob": file,
                }),
            ),
    );

    const { uploadProgress } = useSelector(selectors.fileExplorer.uploadProgress);

    if (currentWorkingDirectoryView === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="files"
                title={t("page title - my files")}
                helpTitle={t("what this page is used for - my files")}
                helpContent={helpContent}
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
                isNavigating={currentWorkingDirectoryView.isNavigationOngoing}
                apiLogs={s3ApiLogs}
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
                pathMinDepth={1}
                scrollableDivRef={scrollableDivRef}
                {...{
                    "isFileOpen": false as const,
                    onOpenFile,
                }}
            />
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "page title - my files"
    | "page title - my secrets"
    | "what this page is used for - my files"
    | "what this page is used for - my secrets"
    | "learn more - my files"
    | "to learn more - my secrets"
    | "read our documentation"
>()({ MyFiles });

const useStyles = makeStyles({ "name": { MyFiles } })({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column",
    },
    "explorer": {
        "overflow": "hidden",
        "flex": 1,
        "width": "100%",
    },
});
