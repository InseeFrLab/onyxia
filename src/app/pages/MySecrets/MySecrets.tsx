
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useEffect, useState, memo } from "react";
import { useCallback } from "app/utils/hooks/useCallbackFactory";
import { copyToClipboard } from "app/utils/copyToClipboard";
import { useSelector, useDispatch, useEvtSecretsManagerTranslation, useAppConstants } from "app/lib/hooks";
import { Explorer as SecretOrFileExplorer } from "app/components/Explorer";
import { Props as ExplorerProps } from "app/components/Explorer";
import * as lib from "lib/setup";
import { MySecretsEditor } from "./MySecretsEditor";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { PageHeader } from "app/components/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { useWithProps } from "app/utils/hooks/useWithProps";
/*
const { secretExplorer: thunks } = lib.thunks;
const { secretExplorer: pure } = lib.pure;
*/
const thunks = lib.thunks.secretExplorer;
const pure = lib.pure.secretExplorer;

const paddingLeftSpacing = 5;


const { useClassNames } = createUseClassNames<{}>()(
    ({theme})=>({
        "header": {
            "paddingLeft": theme.spacing(paddingLeftSpacing)
        },
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "explorer": {
            "flex": 1,
            "width": "100%"
        }
    })
);




export type Props = {
    className?: string;
    //TODO: Url navigation
    directoryPath?: string;
};

export const MySecrets = memo((props: Props) =>{

    const {
        className,
        directoryPath: directoryPathFromProps,
    } = props;

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

    const onNavigate = useCallback(
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
            })()),
        [dispatch]
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

            if (directoryPathFromProps === undefined) {
                return;
            }

            dispatch(
                thunks.navigateToDirectory({
                    "fromCurrentPath": false,
                    "directoryPath": directoryPathFromProps
                })
            );

        },
        [directoryPathFromProps, dispatch]
    );


    const onEditedBasename = useCallback(
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
            ),
        [dispatch]
    );

    const onDeleteItem = useCallback(
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

        },
        [dispatch]
    );

    const onCreateItem = useCallback(
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
            ),
        [dispatch]
    );

    const onCopyPath = useCallback(
        ({ path }: Parameters<ExplorerProps["onCopyPath"]>[0]) =>
            copyToClipboard(path),
        []
    );

    const { evtSecretsManagerTranslation } = useEvtSecretsManagerTranslation();

    const onEdit = useCallback(
        (params: EditSecretParams) =>
            dispatch(thunks.editCurrentlyShownSecret(params)),
        [dispatch]
    );

    const { classNames } = useClassNames({});

    return state.currentPath === "" ?
        <div className={className}> Placeholder for Marc's loading </div>
        :
        (
            <div className={cx(classNames.root, className)}>

                <PageHeader
                    className={classNames.header}
                    icon="secrets"
                    text1={t("page title")}
                    text2={t("what this page is used for")}
                    text3={t("to learn more read", { "what": t("tfm") })}
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
});

export declare namespace MySecrets {

    export type I18nScheme = {
        'page title': undefined;
        'what this page is used for': undefined;
        'to learn more read': { what: string; }
        tfm: undefined;
    };

}