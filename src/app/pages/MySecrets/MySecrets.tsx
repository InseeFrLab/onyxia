import React, { useMemo, useCallback, useEffect } from "react";
import { withProps } from "app/utils/withProps";
import { copyToClipboard } from "app/utils/copyToClipboard";
import { useSelector, useDispatch, useEvtSecretsManagerTranslation } from "app/lib/hooks";
import { Explorer as SecretOrFileExplorer } from "app/components/Explorer";
import { Props as ExplorerProps } from "app/components/Explorer";
import * as lib from "lib/setup";
import { MySecretsEditor } from "./MySecretsEditor";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { PageHeader } from "app/components/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import clsx from "clsx";
/*
const { secretExplorer: thunks } = lib.thunks;
const { secretExplorer: pure } = lib.pure;
*/
const thunks = lib.thunks.secretExplorer;
const pure = lib.pure.secretExplorer;

const paddingLeftSpacing = 5;

const useStyles = makeStyles(
    theme => createStyles({
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
    className: string;
};

export function MySecrets(props: Props) {

    const { className } = props;

    const { t } = useTranslation("MySecrets");

    const state = useSelector(state => state.secretExplorer);
    const dispatch = useDispatch();

    const Explorer = useMemo(
        () => withProps(
            SecretOrFileExplorer,
            {
                "type": "secret",
                "getIsValidBasename": pure.getIsValidBasename
            }
        ),
        []
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
                        return thunks.navigateToDirectory({ "directoryRelativePath": relativePath });
                    case "file":
                        return thunks.navigateToSecret({ "secretRelativePath": relativePath })
                }
            })()),
        [dispatch]
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

    const classes = useStyles();

    return (
        <div className={clsx(classes.root, className)}>

            <PageHeader
                className={classes.header}
                icon="secrets"
                text1={t("page title")}
                text2={t("what this page is used for")}
                text3={t("to learn more read", { "what": t("tfm") })}
            />
            <Explorer
                paddingLeftSpacing={paddingLeftSpacing}
                className={classes.explorer}
                currentPath={state.currentPath}
                isNavigating={state.isNavigationOngoing}
                evtTranslation={evtSecretsManagerTranslation}
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
};

export declare namespace MySecrets {

    export type I18nScheme = {
        'page title': undefined;
        'what this page is used for': undefined;
        'to learn more read': { what: string; }
        tfm: undefined;
    };

}