import React, { useMemo, useCallback, useEffect } from "react";
import { withProps } from "app/utils/withProps";
import { MySecretsHeader } from "./MySecretsHeader";
import { Container } from "app/components/designSystem/Container";
import { copyToClipboard } from "app/utils/copyToClipboard";
import { useSelector, useDispatch, useEvtSecretsManagerTranslation } from "app/lib/hooks";
import { Explorer as SecretOrFileExplorer } from "app/components/Explorer";
import { Props as ExplorerProps } from "app/components/Explorer";
import * as lib from "lib/setup";
import { MySecretsEditor } from "./MySecretsEditor";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
/*
const { secretExplorer: thunks } = lib.thunks;
const { secretExplorer: pure } = lib.pure;
*/
const thunks = lib.thunks.secretExplorer;
const pure = lib.pure.secretExplorer;

export function MySecrets() {

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

    return (
        <>
            <MySecretsHeader />
            <Container maxWidth="lg">
                <Explorer
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
                    files={state.secrets}
                    directories={state.directories}
                    directoriesBeingCreatedOrRenamed={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.directoriesBeingCreatedOrRenamed
                    }
                    filesBeingCreatedOrRenamed={
                        state.state !== "SHOWING DIRECTORY" ? [] :
                            state.secretsBeingCreatedOrRenamed
                    }
                    onNavigate={onNavigate}
                    onEditBasename={onEditedBasename}
                    onDeleteItem={onDeleteItem}
                    onCreateItem={onCreateItem}
                    onCopyPath={onCopyPath}
                />
            </Container>
        </>
    );
};