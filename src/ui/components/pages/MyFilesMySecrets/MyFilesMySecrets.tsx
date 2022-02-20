import { makeStyles, PageHeader } from "ui/theme";
import { useEffect, useState, useRef, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useSelector, useThunks, selectors } from "ui/coreApi";
import { Explorer } from "./Explorer";
import { ExplorerProps } from "./Explorer";
import { useTranslation } from "ui/i18n/useTranslations";
import Link from "@mui/material/Link";
import { routes } from "ui/routes";
import { createGroup } from "type-route";
import { useSplashScreen } from "onyxia-ui";
import type { Route } from "type-route";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper";
import type { Param0 } from "tsafe";
import { assert } from "tsafe/assert";
import { MySecretsEditor, Props as MySecretsEditorProps } from "./MySecretsEditor";

MyFilesMySecrets.routeGroup = createGroup([routes.myFilesDev, routes.mySecretsDev]);

type PageRoute = Route<typeof MyFilesMySecrets.routeGroup>;

MyFilesMySecrets.getDoRequireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

export function MyFilesMySecrets(props: Props) {
    //TODO: Fix how routes are handled, can't navigate back for example.
    const { className, route } = props;

    const { t } = useTranslation({ MyFilesMySecrets });

    const explorerType = useMemo(() => {
        switch (route.name) {
            case "myFilesDev":
                return "s3";
            case "mySecretsDev":
                return "secrets";
        }
    }, [route.name]);

    const cwdVue = useSelector(selectors.explorers.cwdIconsVue).cwdIconsVue[explorerType];

    const secretEditorState = useSelector(state => state.secretsEditor);

    const { explorersThunks, secretsEditorThunks, userConfigsThunks } = useThunks();

    {
        const onNavigate = useConstCallback<
            Param0<typeof explorersThunks["notifyThatUserIsWatching"]>["onNavigate"]
        >(({ directoryPath, doRestoreOpenedFile }) =>
            routes[route.name]({
                "path": directoryPath,
                ...(explorerType !== "secrets" || !doRestoreOpenedFile
                    ? {}
                    : { "openFile": secretEditorState?.basename }),
            }).replace(),
        );

        useEffect(() => {
            explorersThunks.notifyThatUserIsWatching({
                explorerType,
                "directNavigationDirectoryPath": route.params.path,
                onNavigate,
            });

            return () =>
                explorersThunks.notifyThatUserIsNoLongerWatching({ explorerType });
        }, [explorerType, route.name]);
    }

    useEffect(() => {
        if (explorerType !== "secrets" || route.params.path === undefined) {
            return;
        }

        if (route.params.openFile === undefined) {
            secretsEditorThunks.closeSecret();
        } else {
            secretsEditorThunks.openSecret({
                "directoryPath": route.params.path,
                "basename": route.params.openFile,
            });
        }
    }, [explorerType, route.params.path, route.params.openFile]);

    useEffect(() => {
        if (route.params.path === undefined) {
            return;
        }

        explorersThunks.navigate({
            explorerType,
            "directoryPath": route.params.path,
        });
    }, [route.params.path, explorerType]);

    const onNavigate = useConstCallback(
        ({ directoryPath }: Param0<ExplorerProps["onNavigate"]>) =>
            routes[route.name]({ "path": directoryPath }).push(),
    );

    const onRefresh = useConstCallback(() => explorersThunks.refresh({ explorerType }));

    const onEditBasename = useConstCallback(
        ({ kind, basename, newBasename }: Param0<ExplorerProps["onEditBasename"]>) => {
            assert(explorerType === "secrets", "Can't rename in S3");

            explorersThunks.rename({
                explorerType,
                "renamingWhat": kind,
                basename,
                newBasename,
            });
        },
    );

    const onNewItem = useConstCallback(
        ({ kind, suggestedBasename }: Param0<ExplorerProps["onNewItem"]>) => {
            switch (kind) {
                case "directory":
                    explorersThunks.create({
                        explorerType,
                        "createWhat": "directory",
                        "basename": suggestedBasename,
                    });
                    break;
                case "file":
                    switch (explorerType) {
                        case "secrets":
                            explorersThunks.create({
                                "explorerType": "secrets",
                                "createWhat": "file",
                                "basename": suggestedBasename,
                            });
                            break;
                        case "s3":
                            (async () => {
                                alert("TODO: ui for uploading a file");

                                await new Promise(resolve => setTimeout(resolve, 2000));

                                const basename = "my_file.txt";
                                const data = "010001010111010111";

                                explorersThunks.create({
                                    "explorerType": "s3",
                                    "createWhat": "file",
                                    basename,
                                    data,
                                });
                            })();
                            break;
                    }
                    break;
            }
        },
    );

    const onDeleteItem = useConstCallback(
        ({ kind, basename }: Param0<ExplorerProps["onDeleteItem"]>) =>
            explorersThunks.delete({
                explorerType,
                "deleteWhat": kind,
                basename,
            }),
    );

    const onCopyPath = useConstCallback(({ path }: Param0<ExplorerProps["onCopyPath"]>) =>
        copyToClipboard(path.split("/").slice(2).join("/")),
    );

    const apiLogs = useMemo(
        () => explorersThunks.getApiLogs({ explorerType }),
        [explorerType],
    );

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (cwdVue === undefined) {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [cwdVue === undefined]);

    const [evtButtonBarAction] = useState(() =>
        Evt.create<UnpackEvt<ExplorerProps["evtAction"]>>(),
    );

    const scrollableDivRef = useRef<HTMLDivElement>(null);

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
                {t(
                    (() => {
                        switch (explorerType) {
                            case "s3":
                                return "learn more - my files";
                            case "secrets":
                                return "to learn more - my secrets";
                        }
                    })(),
                )}
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
        [explorerType, t],
    );

    const onOpenFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: false }>["onOpenFile"]
    >(({ basename }) => {
        routes[route.name]({ ...route.params, "openFile": basename }).replace();
    });

    const onCloseFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: true }>["onCloseFile"]
    >(() =>
        routes[route.name](
            (() => {
                const { openFile, ...rest } = route.params;
                return rest;
            })(),
        ).replace(),
    );

    const onMySecretEditorCopyPath = useConstCallback(() =>
        evtButtonBarAction.post("TRIGGER COPY PATH"),
    );

    const onEdit = useConstCallback<MySecretsEditorProps["onEdit"]>(params =>
        secretsEditorThunks.editCurrentlyShownSecret(params),
    );

    const {
        userConfigs: { doDisplayMySecretsUseInServiceDialog },
    } = useSelector(selectors.userConfigs.userConfigs);

    const onDoDisplayUseInServiceDialogValueChange = useConstCallback(value =>
        userConfigsThunks.changeValue({
            "key": "doDisplayMySecretsUseInServiceDialog",
            value,
        }),
    );

    if (
        cwdVue === undefined ||
        //NOTE: This test is just so we dont have flickering when we come back to an opened file
        //it works without it.
        (secretEditorState !== null && secretEditorState.secretWithMetadata === undefined)
    ) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={(() => {
                    switch (explorerType) {
                        case "s3":
                            return "files";
                        case "secrets":
                            return "secrets";
                    }
                })()}
                title={t(
                    (() => {
                        switch (explorerType) {
                            case "s3":
                                return "page title - my files";
                            case "secrets":
                                return "page title - my secrets";
                        }
                    })(),
                )}
                helpTitle={t(
                    (() => {
                        switch (explorerType) {
                            case "s3":
                                return "what this page is used for - my files";
                            case "secrets":
                                return "what this page is used for - my secrets";
                        }
                    })(),
                )}
                helpContent={helpContent}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <Explorer
                className={classes.explorer}
                explorerType={explorerType}
                doShowHidden={false}
                directoryPath={cwdVue.directoryPath}
                isNavigating={cwdVue.isNavigationOngoing}
                apiLogs={apiLogs}
                evtAction={evtButtonBarAction}
                files={cwdVue.files}
                directories={cwdVue.directories}
                directoriesBeingCreated={cwdVue.directoriesBeingCreated}
                directoriesBeingRenamed={cwdVue.directoriesBeingRenamed}
                filesBeingCreated={cwdVue.filesBeingCreated}
                filesBeingRenamed={cwdVue.filesBeingRenamed}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                onEditBasename={onEditBasename}
                onDeleteItem={onDeleteItem}
                onNewItem={onNewItem}
                onCopyPath={onCopyPath}
                pathMinDepth={1}
                scrollableDivRef={scrollableDivRef}
                {...(() => {
                    switch (explorerType) {
                        case "s3":
                            return {
                                "isFileOpen": false as const,
                                onOpenFile,
                            };
                        case "secrets": {
                            if (secretEditorState?.secretWithMetadata === undefined) {
                                return {
                                    "isFileOpen": false as const,
                                    onOpenFile,
                                };
                            }

                            return {
                                "isFileOpen": true as const,
                                "openFileTime": new Date(
                                    secretEditorState.secretWithMetadata.metadata.created_time,
                                ).getTime(),

                                "openFileBasename": secretEditorState.basename,
                                onCloseFile,
                                "openFileNode": (
                                    <MySecretsEditor
                                        onCopyPath={onMySecretEditorCopyPath}
                                        isBeingUpdated={secretEditorState.isBeingUpdated}
                                        secretWithMetadata={
                                            secretEditorState.secretWithMetadata
                                        }
                                        onEdit={onEdit}
                                        doDisplayUseInServiceDialog={
                                            doDisplayMySecretsUseInServiceDialog
                                        }
                                        onDoDisplayUseInServiceDialogValueChange={
                                            onDoDisplayUseInServiceDialogValueChange
                                        }
                                    />
                                ),
                            };
                        }
                    }
                })()}
            />
        </div>
    );
}

export declare namespace MyFilesMySecrets {
    export type I18nScheme = {
        "page title - my files": undefined;
        "page title - my secrets": undefined;
        "what this page is used for - my files": undefined;
        "what this page is used for - my secrets": undefined;
        "learn more - my files": undefined;
        "to learn more - my secrets": undefined;
        "read our documentation": undefined;
    };
}

const useStyles = makeStyles({ "name": { MyFilesMySecrets } })({
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
