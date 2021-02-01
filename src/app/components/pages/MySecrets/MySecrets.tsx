
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { useSelector, useDispatch, useEvtSecretsManagerTranslation, useAppConstants } from "app/lib/hooks";
import { Explorer as SecretOrFileExplorer } from "app/components/shared/Explorer";
import { Props as ExplorerProps } from "app/components/shared/Explorer";
import * as lib from "lib/setup";
import { MySecretsEditor } from "./MySecretsEditor";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { PageHeader } from "app/components/shared/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { useWithProps } from "app/tools/hooks/useWithProps";
import { relative as pathRelative } from "path";
import Link from "@material-ui/core/Link";
import videoUrl from "app/assets/videos/Demo_My_Secrets.mp4";
import type { Route } from "type-route";
import { routes } from "app/router";
import { createGroup } from "type-route";


/*
const { secretExplorer: thunks } = lib.thunks;
const { secretExplorer: pure } = lib.pure;
*/
const thunks = lib.thunks.secretExplorer;
const pure = lib.pure.secretExplorer;

const paddingLeftSpacing = 5;

const { useClassNames } = createUseClassNames<{}>()(
    ({ theme }) => ({
        "header": {
            "paddingLeft": theme.spacing(paddingLeftSpacing)
        },
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "explorer": {
            "overflow": "hidden",
            "flex": 1,
            "width": "100%"
        }
    })
);

export type Props = {
    className?: string;
    route: Route<typeof MySecrets.routeGroup>;
    splashScreen: ReactNode;
};

MySecrets.routeGroup = createGroup([routes.mySecrets]);

MySecrets.requireUserLoggedIn = true;

export function MySecrets(props: Props) {

    const {
        className,
        route,
        splashScreen
    } = props;

    //TODO
    console.log(route);
    const directoryPathFromRoot: string | undefined = undefined;

    const { t } = useTranslation("MySecrets");

    const state = useSelector(state => state.secretExplorer);
    const dispatch = useDispatch();

    const Explorer = useWithProps(
        SecretOrFileExplorer,
        {
            "type": "secret",
            "getIsValidBasename": pure.getIsValidBasename
        }
    );

    useEffect(() => {

        if (state.state !== "FAILURE") {
            return;
        }

        alert(state.errorMessage);

    }, [state]);

    const onNavigate = useConstCallback(
        ({ kind, relativePath }: Parameters<ExplorerProps["onNavigate"]>[0]) =>
            dispatch((() => {
                switch (kind) {
                    case "directory":
                        return thunks.navigateToDirectory({
                            "fromCurrentPath": true,
                            "directoryRelativePath": relativePath
                        });
                    case "file":
                        return thunks.navigateToSecret({
                            "fromCurrentPath": true,
                            "secretRelativePath": relativePath
                        })
                }
            })())
    );


    const { userHomePath } = (function useClosure() {

        const { userProfile: { idep } } = useAppConstants({ "assertIsUserLoggedInIs": true });
        const userHomePath = pure.getUserHomePath({ idep });
        return { userHomePath };

    })();

    useState(
        () => {

            if (state.currentPath !== "") {
                return;
            }

            dispatch(
                thunks.navigateToDirectory({
                    "fromCurrentPath": false,
                    "directoryPath": userHomePath
                })
            );

        }
    );

    useEffect(
        () => {

            if (directoryPathFromRoot === undefined) {
                return;
            }

            dispatch(
                thunks.navigateToDirectory({
                    "fromCurrentPath": false,
                    "directoryPath": directoryPathFromRoot
                })
            );

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [directoryPathFromRoot]
    );


    const onEditedBasename = useConstCallback(
        ({ kind, basename, editedBasename }: Parameters<ExplorerProps["onEditBasename"]>[0]) =>
            dispatch(
                thunks.renameDirectoryOrSecretWithinCurrentDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file": return "secret";
                            case "directory": return "directory"
                        }
                    })(),
                    basename,
                    "newBasename": editedBasename
                })
            )
    );

    const onDeleteItem = useConstCallback(
        async ({ kind, basename }: Parameters<ExplorerProps["onDeleteItem"]>[0]) => {

            console.log("TODO: Deletion started");

            await dispatch(
                thunks.deleteDirectoryOrSecretWithinCurrentDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file": return "secret";
                            case "directory": return "directory"
                        }
                    })(),
                    basename
                })
            );

            console.log("TODO: Deletion completed");

        }
    );

    const onCreateItem = useConstCallback(
        ({ kind, basename }: Parameters<ExplorerProps["onCreateItem"]>[0]) =>
            dispatch(
                thunks.createSecretOrDirectory({
                    "kind": (() => {
                        switch (kind) {
                            case "file": return "secret";
                            case "directory": return "directory"
                        }
                    })(),
                    basename
                })
            )
    );

    const onCopyPath = useConstCallback(
        (params?: { path: string; }): void => {

            const { path } = params ?? { "path": state.currentPath };

            copyToClipboard(pathRelative(userHomePath, path));

        }
    );

    const { evtSecretsManagerTranslation } = useEvtSecretsManagerTranslation();

    const onEdit = useConstCallback(
        (params: EditSecretParams) =>
            dispatch(thunks.editCurrentlyShownSecret(params))
    );

    const { classNames } = useClassNames({});

    return state.currentPath === "" ?
        <>{splashScreen}</>
        :
        (
            <div className={cx(classNames.root, className)}>

                <PageHeader
                    className={classNames.header}
                    icon="secrets"
                    text1={t("page title")}
                    text2={t("what this page is used for")}
                    text3={<>{t("watch the video")} <Link href={videoUrl} target="_blank">{t("here")}</Link></>}
                />
                <Explorer
                    paddingLeftSpacing={paddingLeftSpacing}
                    className={classNames.explorer}
                    browsablePath={userHomePath}
                    currentPath={state.currentPath}
                    isNavigating={state.isNavigationOngoing}
                    evtTranslation={evtSecretsManagerTranslation}
                    showHidden={false}
                    file={
                        state.state !== "SHOWING SECRET" ? null :
                            <MySecretsEditor
                                onCopyPath={onCopyPath}
                                isBeingUpdated={state.isBeingUpdated}
                                secretWithMetadata={state.secretWithMetadata}
                                onEdit={onEdit}
                            />
                    }
                    fileDate={
                        state.state !== "SHOWING SECRET" ?
                            undefined :
                            new Date(state.secretWithMetadata.metadata.created_time)
                    }
                    files={state.secrets}
                    directories={state.directories}
                    directoriesBeingCreated={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.directoriesBeingCreated
                    }
                    directoriesBeingRenamed={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.directoriesBeingRenamed

                    }
                    filesBeingCreated={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.secretsBeingCreated
                    }
                    filesBeingRenamed={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.secretsBeingRenamed
                    }
                    onNavigate={onNavigate}
                    onEditBasename={onEditedBasename}
                    onDeleteItem={onDeleteItem}
                    onCreateItem={onCreateItem}
                    onCopyPath={onCopyPath}
                />
            </div>
        );
};


export declare namespace MySecrets {

    export type I18nScheme = {
        'page title': undefined;
        'what this page is used for': undefined;
        'watch the video': undefined;
        'here': undefined;
    };

}