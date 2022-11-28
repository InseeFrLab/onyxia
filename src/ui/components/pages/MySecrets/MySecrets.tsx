import { makeStyles, PageHeader } from "ui/theme";
import { useEffect, useState, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, useCoreFunctions, selectors } from "core";
import { SecretsExplorer } from "./SecretsExplorer";
import { ExplorerProps } from "./SecretsExplorer";
import { useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { createGroup } from "type-route";
import { useSplashScreen } from "onyxia-ui";
import type { Route } from "type-route";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper_legacy";
import type { Param0 } from "tsafe";
import { assert } from "tsafe/assert";
import { MySecretsEditor } from "./MySecretsEditor";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import type { Link } from "type-route";

MySecrets.routeGroup = createGroup([routes.mySecrets]);

type PageRoute = Route<typeof MySecrets.routeGroup>;

MySecrets.getDoRequireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

export function MySecrets(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MySecrets });

    const currentWorkingDirectoryView = useCoreState(
        selectors.secretExplorer.currentWorkingDirectoryView
    ).currentWorkingDirectoryView;

    const secretEditorState = useCoreState(state => state.secretsEditor);

    const { secretExplorer, secretsEditor, userConfigs } = useCoreFunctions();

    {
        const onNavigate = useConstCallback<
            Param0<typeof secretExplorer["notifyThatUserIsWatching"]>["onNavigate"]
        >(({ directoryPath, doRestoreOpenedFile }) =>
            routes[route.name]({
                "path": directoryPath,
                ...(!doRestoreOpenedFile
                    ? {}
                    : {
                          "openFile": route.params.openFile ?? secretEditorState?.basename
                      })
            }).replace()
        );

        useEffect(() => {
            secretExplorer.notifyThatUserIsWatching({
                "directNavigationDirectoryPath": route.params.path,
                onNavigate
            });

            return () => secretExplorer.notifyThatUserIsNoLongerWatching();
        }, [route.name]);
    }

    useEffect(() => {
        if (route.params.path === undefined) {
            return;
        }

        if (route.params.openFile === undefined) {
            secretsEditor.closeSecret();
        } else {
            secretsEditor.openSecret({
                "directoryPath": route.params.path,
                "basename": route.params.openFile
            });
        }
    }, [route.params.path, route.params.openFile]);

    useEffect(() => {
        if (route.params.path === undefined) {
            return;
        }

        secretExplorer.navigate({
            "directoryPath": route.params.path
        });
    }, [route.params.path]);

    const onNavigate = useConstCallback(
        ({ directoryPath }: Param0<ExplorerProps["onNavigate"]>) =>
            routes[route.name]({ "path": directoryPath }).push()
    );

    const onRefresh = useConstCallback(() => secretExplorer.refresh());

    const onEditBasename = useConstCallback(
        ({ kind, basename, newBasename }: Param0<ExplorerProps["onEditBasename"]>) => {
            secretExplorer.rename({
                "renamingWhat": kind,
                basename,
                newBasename
            });
        }
    );

    const onNewItem = useConstCallback(
        ({ kind, suggestedBasename }: Param0<ExplorerProps["onNewItem"]>) => {
            switch (kind) {
                case "directory":
                    secretExplorer.create({
                        "createWhat": "directory",
                        "basename": suggestedBasename
                    });
                    break;
                case "file":
                    secretExplorer.create({
                        "createWhat": "file",
                        "basename": suggestedBasename
                    });
                    break;
            }
        }
    );

    const onDeleteItem = useConstCallback(
        ({ kind, basename }: Param0<ExplorerProps["onDeleteItem"]>) =>
            secretExplorer.delete({
                "deleteWhat": kind,
                basename
            })
    );

    const onCopyPath = useConstCallback(({ path }: Param0<ExplorerProps["onCopyPath"]>) =>
        copyToClipboard(path.split("/").slice(2).join("/"))
    );

    const fsApiLogs = useMemo(() => secretExplorer.getFsApiLogs(), []);

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [currentWorkingDirectoryView === undefined]);

    const [evtExplorerAction] = useState(() =>
        Evt.create<UnpackEvt<ExplorerProps["evtAction"]>>()
    );

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

    const onOpenFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: false }>["onOpenFile"]
    >(({ basename }) => {
        routes.mySecrets({ ...route.params, "openFile": basename }).replace();
    });

    const onCloseFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: true }>["onCloseFile"]
    >(() =>
        routes[route.name](
            (() => {
                const { openFile, ...rest } = route.params;
                return rest;
            })()
        ).replace()
    );

    const onRefreshOpenFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: true }>["onRefreshOpenFile"]
    >(() => {
        assert(secretEditorState !== null);
        assert(secretEditorState.secretWithMetadata !== undefined);

        const { basename, directoryPath } = secretEditorState;

        secretsEditor.openSecret({ directoryPath, basename });
    });

    const onMySecretEditorCopyPath = useConstCallback(() =>
        evtExplorerAction.post("TRIGGER COPY PATH")
    );

    const {
        userConfigs: { doDisplayMySecretsUseInServiceDialog }
    } = useCoreState(selectors.userConfigs.userConfigs);

    const onDoDisplayUseInServiceDialogValueChange = useConstCallback(value =>
        userConfigs.changeValue({
            "key": "doDisplayMySecretsUseInServiceDialog",
            value
        })
    );

    if (currentWorkingDirectoryView === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={"secrets"}
                title={t("page title - my secrets")}
                helpTitle={t("what this page is used for - my secrets")}
                helpContent={t("help content", {
                    "docHref":
                        "https://docs.sspcloud.fr/onyxia-guide/utiliser-des-variables-denvironnement",
                    "accountTabLink": routes.account({ "tabId": "vault" }).link
                })}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <SecretsExplorer
                className={classes.explorer}
                doShowHidden={false}
                directoryPath={currentWorkingDirectoryView.directoryPath}
                isNavigating={currentWorkingDirectoryView.isNavigationOngoing}
                apiLogs={fsApiLogs}
                evtAction={evtExplorerAction}
                files={currentWorkingDirectoryView.files}
                directories={currentWorkingDirectoryView.directories}
                directoriesBeingCreated={
                    currentWorkingDirectoryView.directoriesBeingCreated
                }
                directoriesBeingRenamed={
                    currentWorkingDirectoryView.directoriesBeingRenamed
                }
                filesBeingCreated={currentWorkingDirectoryView.filesBeingCreated}
                filesBeingRenamed={currentWorkingDirectoryView.filesBeingRenamed}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                onEditBasename={onEditBasename}
                onDeleteItem={onDeleteItem}
                onNewItem={onNewItem}
                onCopyPath={onCopyPath}
                pathMinDepth={1}
                scrollableDivRef={scrollableDivRef}
                {...(() => {
                    if (secretEditorState === null) {
                        return {
                            "isFileOpen": false as const,
                            onOpenFile
                        };
                    }

                    const { secretWithMetadata } = secretEditorState;

                    if (secretWithMetadata === undefined) {
                        return {
                            "isFileOpen": true as const,
                            "openFileTime": undefined,
                            "openFileBasename": secretEditorState.basename,
                            "onCloseFile": () => {},
                            "onRefreshOpenFile": () => {},
                            "openFileNode": null
                        };
                    }

                    return {
                        "isFileOpen": true as const,
                        "openFileTime": new Date(
                            secretWithMetadata.metadata.created_time
                        ).getTime(),
                        "openFileBasename": secretEditorState.basename,
                        onCloseFile,
                        onRefreshOpenFile,
                        "openFileNode": (
                            <MySecretsEditor
                                onCopyPath={onMySecretEditorCopyPath}
                                isBeingUpdated={secretEditorState.isBeingUpdated}
                                secretWithMetadata={secretWithMetadata}
                                onEdit={secretsEditor.editCurrentlyShownSecret}
                                doDisplayUseInServiceDialog={
                                    doDisplayMySecretsUseInServiceDialog
                                }
                                onDoDisplayUseInServiceDialogValueChange={
                                    onDoDisplayUseInServiceDialogValueChange
                                }
                            />
                        )
                    };
                })()}
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
    | {
          K: "help content";
          P: {
              docHref: string;
              accountTabLink: Link;
          };
          R: JSX.Element;
      }
>()({ MySecrets: MySecrets });

const useStyles = makeStyles({ "name": { MySecrets: MySecrets } })({
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
