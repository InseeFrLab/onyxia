import { makeStyles, PageHeader } from "app/theme";
import { useEffect, useState, useRef, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "app/tools/copyToClipboard";
import {
    useSelector,
    useDispatch,
    useEvtSecretsManagerTranslation,
} from "app/interfaceWithLib/hooks";
import { Explorer as SecretOrFileExplorer } from "app/components/shared/Explorer";
import { ExplorerProps } from "app/components/shared/Explorer";
import { MySecretsEditor } from "./MySecretsEditor";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { useTranslation } from "app/i18n/useTranslations";
import { useWithProps } from "powerhooks/useWithProps";
import { relative as pathRelative } from "path";
import Link from "@material-ui/core/Link";
import { routes } from "app/routes/router";
import { createGroup } from "type-route";
import { useSecretExplorerUserHomePath } from "app/interfaceWithLib/hooks";
import { useSplashScreen } from "onyxia-ui";
import type { Route } from "type-route";
import { thunks, pure } from "lib/setup";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper";

MySecrets.routeGroup = createGroup([routes.mySecrets]);

type PageRoute = Route<typeof MySecrets.routeGroup>;

MySecrets.requireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

const useStyles = makeStyles()({
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

export function MySecrets(props: Props) {
    //TODO: Fix how routes are handled, can't navigate back for example.
    const { className, route } = props;

    const { t } = useTranslation("MySecrets");

    const state = useSelector(state => state.secretExplorer);
    const dispatch = useDispatch();

    const Explorer = useWithProps(SecretOrFileExplorer, {
        "useCase": "secret",
        "getIsValidBasename": pure.secretExplorer.getIsValidBasename,
    });

    useEffect(() => {
        if (state.state !== "FAILURE") {
            return;
        }

        alert(state.errorMessage);
    }, [state]);

    const onNavigate = useConstCallback(
        ({ kind, relativePath }: Parameters<ExplorerProps["onNavigate"]>[0]) =>
            dispatch(
                (() => {
                    switch (kind) {
                        case "directory":
                            return thunks.secretExplorer.navigateToDirectory({
                                "fromCurrentPath": true,
                                "directoryRelativePath": relativePath,
                            });
                        case "file":
                            return thunks.secretExplorer.navigateToSecret({
                                "fromCurrentPath": true,
                                "secretRelativePath": relativePath,
                            });
                    }
                })(),
            ),
    );

    const { secretExplorerUserHomePath: userHomePath } = useSecretExplorerUserHomePath();

    useEffect(() => {
        if (state.currentPath !== "") {
            return;
        }

        //We allow route to be null to be able to test in storybook
        const { secretOrDirectoryPath = userHomePath, isFile = false } =
            route?.params ?? {};

        dispatch(
            isFile
                ? thunks.secretExplorer.navigateToSecret({
                      "fromCurrentPath": false,
                      "secretPath": secretOrDirectoryPath,
                  })
                : thunks.secretExplorer.navigateToDirectory({
                      "fromCurrentPath": false,
                      "directoryPath": secretOrDirectoryPath,
                  }),
        );
    }, []);

    useEffect(() => {
        if (state.currentPath === "" || route === undefined) {
            return;
        }

        routes
            .mySecrets({
                ...(state.state === "SHOWING SECRET" ? { "isFile": true } : {}),
                "secretOrDirectoryPath": state.currentPath.replace(/^\//, ""),
            })
            .push();
    }, [state.currentPath]);

    const onEditedBasename = useConstCallback(
        ({
            kind,
            basename,
            editedBasename,
        }: Parameters<ExplorerProps["onEditBasename"]>[0]) =>
            dispatch(
                thunks.secretExplorer.renameDirectoryOrSecretWithinCurrentDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file":
                                return "secret";
                            case "directory":
                                return "directory";
                        }
                    })(),
                    basename,
                    "newBasename": editedBasename,
                }),
            ),
    );

    const onDeleteItem = useConstCallback(
        async ({ kind, basename }: Parameters<ExplorerProps["onDeleteItem"]>[0]) => {
            console.log("TODO: Deletion started");

            await dispatch(
                thunks.secretExplorer.deleteDirectoryOrSecretWithinCurrentDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file":
                                return "secret";
                            case "directory":
                                return "directory";
                        }
                    })(),
                    basename,
                }),
            );

            console.log("TODO: Deletion completed");
        },
    );

    const onCreateItem = useConstCallback(
        ({ kind, basename }: Parameters<ExplorerProps["onCreateItem"]>[0]) =>
            dispatch(
                thunks.secretExplorer.createSecretOrDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file":
                                return "secret";
                            case "directory":
                                return "directory";
                        }
                    })(),
                    basename,
                }),
            ),
    );

    const onCopyPath = useConstCallback((params?: { path: string }): void => {
        const { path } = params ?? { "path": state.currentPath };

        copyToClipboard(pathRelative(userHomePath, path));
    });

    const { evtSecretsManagerTranslation } = useEvtSecretsManagerTranslation();

    const onEdit = useConstCallback((params: EditSecretParams) =>
        dispatch(thunks.secretExplorer.editCurrentlyShownSecret(params)),
    );

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (state.currentPath === "") {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [state.currentPath === ""]);

    const doDisplayUseInServiceDialog = useSelector(
        state => state.userConfigs.doDisplayMySecretsUseInServiceDialog.value,
    );

    const onDoDisplayUseInServiceDialogValueChange = useConstCallback(value =>
        dispatch(
            thunks.userConfigs.changeValue({
                "key": "doDisplayMySecretsUseInServiceDialog",
                value,
            }),
        ),
    );

    const [evtButtonBarAction] = useState(() =>
        Evt.create<UnpackEvt<ExplorerProps["evtAction"]>>(),
    );

    const onMySecretEditorCopyPath = useConstCallback(() =>
        evtButtonBarAction.post("TRIGGER COPY PATH"),
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

    if (state.currentPath === "") {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="secrets"
                title={t("page title")}
                helpTitle={t("what this page is used for")}
                helpContent={
                    <>
                        {t("to learn more")}
                        &nbsp;
                        <Link
                            href="https://docs.sspcloud.fr/onyxia-guide/utiliser-des-variables-denvironnement"
                            target="_blank"
                            underline="hover"
                        >
                            {t("read our documentation")}
                        </Link>
                    </>
                }
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <Explorer
                className={classes.explorer}
                browsablePath={userHomePath}
                currentPath={state.currentPath}
                isNavigating={state.isNavigationOngoing}
                evtTranslation={evtSecretsManagerTranslation}
                evtAction={evtButtonBarAction}
                showHidden={false}
                file={
                    state.state !== "SHOWING SECRET" ? null : (
                        <MySecretsEditor
                            onCopyPath={onMySecretEditorCopyPath}
                            isBeingUpdated={state.isBeingUpdated}
                            secretWithMetadata={state.secretWithMetadata}
                            onEdit={onEdit}
                            doDisplayUseInServiceDialog={doDisplayUseInServiceDialog}
                            onDoDisplayUseInServiceDialogValueChange={
                                onDoDisplayUseInServiceDialogValueChange
                            }
                        />
                    )
                }
                fileDate={
                    state.state !== "SHOWING SECRET"
                        ? undefined
                        : new Date(state.secretWithMetadata.metadata.created_time)
                }
                files={state.secrets}
                directories={state.directories}
                directoriesBeingCreated={
                    state.state !== "SHOWING DIRECTORY"
                        ? []
                        : state.directoriesBeingCreated
                }
                directoriesBeingRenamed={
                    state.state !== "SHOWING DIRECTORY"
                        ? []
                        : state.directoriesBeingRenamed
                }
                filesBeingCreated={
                    state.state !== "SHOWING DIRECTORY" ? [] : state.secretsBeingCreated
                }
                filesBeingRenamed={
                    state.state !== "SHOWING DIRECTORY" ? [] : state.secretsBeingRenamed
                }
                onNavigate={onNavigate}
                onEditBasename={onEditedBasename}
                onDeleteItem={onDeleteItem}
                onCreateItem={onCreateItem}
                onCopyPath={onCopyPath}
                scrollableDivRef={scrollableDivRef}
            />
        </div>
    );
}

export declare namespace MySecrets {
    export type I18nScheme = {
        "page title": undefined;
        "what this page is used for": undefined;
        "to learn more": undefined;
        "read our documentation": undefined;
    };
}
