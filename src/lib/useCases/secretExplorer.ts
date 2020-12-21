import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import type { AppThunk, Dependencies } from "../setup";
import type { SecretWithMetadata, SecretsManagerClient, Secret } from "lib/ports/SecretsManagerClient";
import { assert } from "evt/tools/typeSafety/assert";
import { basename as pathBasename, join as pathJoin, dirname as pathDirname, relative as pathRelative } from "path";
import memoize from "memoizee";
import { Evt } from "evt";
import { crawlFactory } from "lib/utils/crawl";
import { unwrapWritableDraft } from "lib/utils/unwrapWritableDraft";

const getEvtIsCreatingOrRenaming = memoize(
    (_: Dependencies) => Evt.create(false)
);


export declare type SecretExplorerState =
    SecretExplorerState.NavigationOngoing |
    SecretExplorerState.Failure |
    SecretExplorerState.ShowingDirectory |
    SecretExplorerState.ShowingSecret
    ;

export declare namespace SecretExplorerState {

    export type _Common = {
        currentPath: string;
        directories: string[];
        secrets: string[];
    };

    export type NavigationOngoing = _Common & {
        state: "NAVIGATION ONGOING";
    };

    export type Failure = _Common & {
        state: "FAILURE";
        errorMessage: string;
    };

    export type ShowingDirectory = _Common & {
        state: "SHOWING DIRECTORY";
        directoriesBeingCreatedOrRenamed: string[];
        secretsBeingCreatedOrRenamed: string[];
    };

    export type ShowingSecret = _Common & {
        state: "SHOWING SECRET";
        secretWithMetadata: SecretWithMetadata;
        isBeingRenamed: boolean;
        isBeingEdited: boolean;
    };



}

export const name = "secretExplorer";

const { reducer, actions } = createSlice({
    name,
    "initialState": id<SecretExplorerState>(
        id<SecretExplorerState.NavigationOngoing>({
            "state": "NAVIGATION ONGOING",
            "currentPath": "",
            "directories": [],
            "secrets": []
        })
    ),
    "reducers": {
        "errorOcurred": (
            state,
            { payload }: PayloadAction<{ errorMessage: string; }>
        ) => {

            const { errorMessage } = payload;

            const { directories, secrets } = state;

            return id<SecretExplorerState.Failure>({
                "state": "FAILURE",
                "currentPath": state.currentPath,
                errorMessage,
                directories, secrets
            });

        },
        "navigationStarted": (
            state,
            { payload }: PayloadAction<{ path: string; }>
        ) => {

            const { path } = payload;

            const { directories, secrets } = state;

            return id<SecretExplorerState.NavigationOngoing>({
                "state": "NAVIGATION ONGOING",
                "currentPath": path,
                directories, secrets
            });

        },
        "navigationTowardDirectorySuccess": (
            state,
            { payload }: PayloadAction<Pick<SecretExplorerState.ShowingDirectory, "directories" | "secrets">>
        ) => {

            const { directories, secrets } = payload;

            return id<SecretExplorerState.ShowingDirectory>({
                "state": "SHOWING DIRECTORY",
                "currentPath": state.currentPath,
                directories,
                secrets,
                "directoriesBeingCreatedOrRenamed": [],
                "secretsBeingCreatedOrRenamed": []
            });

        },
        "navigationTowardSecretSuccess": (
            state,
            { payload }: PayloadAction<Pick<SecretExplorerState.ShowingSecret, "secretWithMetadata">>
        ) => {

            const { secretWithMetadata } = payload;

            const { directories, secrets } = state;

            return id<SecretExplorerState.ShowingSecret>({
                "state": "SHOWING SECRET",
                "currentPath": state.currentPath,
                secretWithMetadata,
                "isBeingRenamed": false,
                secrets,
                directories,
                "isBeingEdited": false
            });

        },
        "renameCurrentlyShownSecretStarted": (
            state,
            { payload }: PayloadAction<{ newSecretBasename: string; }>
        ) => {

            const { newSecretBasename } = payload;

            assert(state.state === "SHOWING SECRET");

            state.isBeingRenamed = true;

            state.secrets[state.secrets.indexOf(pathBasename(state.currentPath))] = newSecretBasename;

            state.currentPath = pathJoin(pathDirname(state.currentPath), newSecretBasename);

        },
        "renameCurrentlyShownSecretCompleted": (
            state
        ) => {

            assert(state.state === "SHOWING SECRET");

            state.isBeingRenamed = false;

        },
        "renameDirectoryOrSecretWithinCurrentDirectoryStarted": (
            state,
            { payload }: PayloadAction<{ basename: string; newBasename: string; kind: "secret" | "directory" }>
        ) => {

            const { kind, basename, newBasename } = payload;

            assert(state.state === "SHOWING DIRECTORY");

            const relevantArray = state[(() => {
                switch (kind) {
                    case "secret": return "secrets";
                    case "directory": return "directories";
                }
            })()]

            relevantArray[relevantArray.indexOf(basename)] = newBasename;

            state[(() => {
                switch (kind) {
                    case "secret": return "secretsBeingCreatedOrRenamed";
                    case "directory": return "directoriesBeingCreatedOrRenamed";
                }
            })()].push(newBasename);


        },
        "renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted": (
            state,
            { payload }: PayloadAction<{ basename: string; kind: "secret" | "directory" }>
        ) => {

            const { basename, kind } = payload;

            assert(state.state === "SHOWING DIRECTORY");

            const relevantArray = state[(() => {
                switch (kind) {
                    case "secret": return "secretsBeingCreatedOrRenamed";
                    case "directory": return "directoriesBeingCreatedOrRenamed";
                }
            })()];

            relevantArray.splice(relevantArray.indexOf(basename), 1);

        },
        "createSecretOrDirectoryStarted": (
            state,
            { payload }: PayloadAction<{ basename: string; kind: "secret" | "directory" }>
        ) => {

            const { kind, basename } = payload;

            assert(state.state === "SHOWING DIRECTORY");

            state[(() => {
                switch (kind) {
                    case "secret": return "secrets";
                    case "directory": return "directories";
                }
            })()].push(basename);

            state[(() => {
                switch (kind) {
                    case "secret": return "secretsBeingCreatedOrRenamed";
                    case "directory": return "directoriesBeingCreatedOrRenamed";
                }
            })()].push(basename);



        },
        "deleteDirectoryOrSecretWithinCurrentDirectoryStarted": (
            state,
            { payload }: PayloadAction<{ basename: string; kind: "secret" | "directory" }>
        ) => {

            const { kind, basename } = payload;

            assert(state.state === "SHOWING DIRECTORY");

            const relevantArray = state[(() => {
                switch (kind) {
                    case "secret": return "secrets";
                    case "directory": return "directories";
                }
            })()]

            relevantArray.splice(relevantArray.indexOf(basename), 1);

        },
        "editSecretStarted": (
            state,
            { payload }: PayloadAction<{
                key: string;
            } & ({
                action: "addOrOverwriteKeyValue";
                value: string;
            } | {
                action: "removeKeyValue";
            })>
        ) => {

            assert(state.state === "SHOWING SECRET");

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function

            const { secret } = unwrapWritableDraft(state).secretWithMetadata;

            switch (payload.action) {
                case "addOrOverwriteKeyValue": {
                    const { key, value } = payload;
                    secret[key] = value;
                } break;
                case "removeKeyValue": {
                    const { key } = payload;
                    delete secret[key];
                } break;
            }

            state.isBeingEdited = true;

        },
        "editSecretCompleted": (
            state,
            { payload }: PayloadAction<{ newMetadata: SecretWithMetadata["metadata"]; }>
        ) => {

            const { newMetadata } = payload;

            if (state.state !== "SHOWING SECRET") {
                return;
            }

            state.secretWithMetadata.metadata = newMetadata;

            state.isBeingEdited = false;

        }

    }
});

export { reducer };

export const thunks = {
    /**
    * NOTE: It IS possible to navigate to a directory currently being renamed or created.
    */
    "navigateToDirectory":
        (params: { directoryRelativePath: string; }): AppThunk => async (...args) => {

            const { directoryRelativePath } = params;

            const [dispatch, getState, dependencies] = args;
            const { secretsManagerClient } = dependencies;

            await getEvtIsCreatingOrRenaming(dependencies)
                .waitFor(isCreatingOrRenaming => !isCreatingOrRenaming);

            const directoryPath = pathJoin(getState().secretExplorer.currentPath, directoryRelativePath);

            dispatch(actions.navigationStarted({ "path": directoryPath }));

            const listResult = await secretsManagerClient.list({ "path": directoryPath })
                .catch((error: Error) => error);

            dispatch(
                listResult instanceof Error ?
                    actions.errorOcurred({ "errorMessage": listResult.message }) :
                    actions.navigationTowardDirectorySuccess(listResult)
            );

        },
    /**
     * NOTE: It IS possible to navigate to a secret currently being renamed or created.
     */
    "navigateToSecret":
        (params: { secretRelativePath: string; }): AppThunk => async (...args) => {

            const { secretRelativePath } = params;

            const [dispatch, getState, dependencies] = args;
            const { secretsManagerClient } = dependencies;

            await getEvtIsCreatingOrRenaming(dependencies)
                .waitFor(isCreatingOrRenaming => !isCreatingOrRenaming);

            const secretPath = pathJoin(getState().secretExplorer.currentPath, secretRelativePath);

            dispatch(actions.navigationStarted({ "path": secretPath }));

            const secretWithMetadata = await secretsManagerClient.get({ "path": secretPath })
                .catch((error: Error) => error);

            dispatch(
                secretWithMetadata instanceof Error ?
                    actions.errorOcurred({ "errorMessage": secretWithMetadata.message }) :
                    actions.navigationTowardSecretSuccess({ secretWithMetadata })
            );

        },
    /**
     * Assert:
     * We are currently showing a secret ( state === "SHOWING SECRET" ).
     * There is not already another secret with this name in the
     * directory the secret is in.
     * The secret is not already being renamed or deleted.
     */
    "renameCurrentlyShownSecret":
        (params: {
            newSecretBasename: string;
        }): AppThunk => async (...args) => {

            const { newSecretBasename } = params;

            const [dispatch, getState, dependencies] = args;
            const { secretsManagerClient } = dependencies;
            const evtIsCreatingOrRenaming = getEvtIsCreatingOrRenaming(dependencies);

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING SECRET");

            dispatch(
                actions.renameCurrentlyShownSecretStarted(
                    { newSecretBasename }
                )
            );

            const { secretsManagerClientExtension } = getSecretsManagerClientExtension(
                secretsManagerClient
            );

            evtIsCreatingOrRenaming.state = true;

            const error = await secretsManagerClientExtension.renameSecret({
                "path": state.currentPath,
                newSecretBasename,
                "secret": state.secretWithMetadata.secret
            }).then(
                () => undefined,
                (error: Error) => error
            );

            dispatch(
                error !== undefined ?
                    actions.errorOcurred({ "errorMessage": error.message }) :
                    actions.renameCurrentlyShownSecretCompleted()
            );

            evtIsCreatingOrRenaming.state = false;


        },
    /** 
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     * The secret or directory we are renaming is present in the directory 
     * currently listed.
     * The secret or directory we are about to rename is not  being
     * renamed or created.
     */
    "renameDirectoryOrSecretWithinCurrentDirectory":
        (params: {
            basename: string;
            newBasename: string;
            kind: "secret" | "directory"
        }): AppThunk => async (...args) => {

            const { basename, newBasename, kind } = params;

            const [dispatch, getState, dependencies] = args;
            const { secretsManagerClient } = dependencies;
            const evtIsCreatingOrRenaming = getEvtIsCreatingOrRenaming(dependencies);

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(
                actions.renameDirectoryOrSecretWithinCurrentDirectoryStarted(
                    { basename, kind, newBasename }
                )
            );

            const { secretsManagerClientExtension } = getSecretsManagerClientExtension(
                secretsManagerClient
            );

            evtIsCreatingOrRenaming.state = true;

            const error = await (
                kind === "secret" ?
                    secretsManagerClientExtension.renameSecret({
                        path,
                        "newSecretBasename": newBasename
                    })
                    :
                    secretsManagerClientExtension.renameDirectory({
                        path,
                        newBasename
                    })
            ).then(
                () => undefined,
                (error: Error) => error
            )

            dispatch(
                error !== undefined ?
                    actions.errorOcurred({ "errorMessage": error.message }) :
                    actions.renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted(
                        { "basename": newBasename, kind }
                    )
            );

            {

                const { secretExplorer: state } = getState();

                assert(state.state === "SHOWING DIRECTORY");

                if (
                    state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingCreatedOrRenamed";
                            case "secret": return "secretsBeingCreatedOrRenamed";
                        }
                    })()].length !== 0
                ) {
                    return;
                }

                evtIsCreatingOrRenaming.state = false;

            }

        },
    /** 
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     */
    "createSecretOrDirectory":
        (params: {
            basename: string;
            kind: "secret" | "directory"
        }): AppThunk => async (...args) => {


            const { basename, kind } = params;

            const [dispatch, getState, dependencies] = args;
            const { secretsManagerClient } = dependencies;
            const evtIsCreatingOrRenaming = getEvtIsCreatingOrRenaming(dependencies);

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(
                actions.createSecretOrDirectoryStarted(
                    { basename, kind }
                )
            );

            const { secretsManagerClientExtension } = getSecretsManagerClientExtension(
                secretsManagerClient
            );

            evtIsCreatingOrRenaming.state = true;

            const error = await (
                kind === "secret" ?
                    secretsManagerClient.put({ path, "secret": { "foo": "bar" } }) :
                    secretsManagerClientExtension.createDirectory({ path })
            ).then(
                () => undefined,
                (error: Error) => error
            )

            dispatch(
                error !== undefined ?
                    actions.errorOcurred({ "errorMessage": error.message }) :
                    actions.renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted(
                        { basename, kind }
                    )
            );

            {

                const { secretExplorer: state } = getState();

                assert(state.state === "SHOWING DIRECTORY");

                if (
                    state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingCreatedOrRenamed";
                            case "secret": return "secretsBeingCreatedOrRenamed";
                        }
                    })()].length !== 0
                ) {
                    return;
                }

                evtIsCreatingOrRenaming.state = false;

            }


        },

    /**
     * Assert:
     * We are currently showing a secret ( state === "SHOWING SECRET" ).
     * The secret is not already being renamed.
     */
    "deleteCurrentlyShownSecret":
        (): AppThunk => async (...args) => {

            const [dispatch, getState] = args;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING SECRET");

            await dispatch(
                thunks.navigateToDirectory({ "directoryRelativePath": ".." })
            );

            await dispatch(
                thunks.deleteDirectoryOrSecretWithinCurrentDirectory({
                    "basename": pathBasename(state.currentPath),
                    "kind": "secret"
                })
            );

        },

    /** 
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     * The secret or directory we are deleting is present in the directory 
     * currently listed.
     * The secret or directory we are about to delete is not being
     * created or renamed.
     */
    "deleteDirectoryOrSecretWithinCurrentDirectory":
        (params: {
            basename: string;
            kind: "secret" | "directory"
        }): AppThunk => async (...args) => {


            const { basename, kind } = params;

            const [dispatch, getState, { secretsManagerClient }] = args;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(
                actions.deleteDirectoryOrSecretWithinCurrentDirectoryStarted(
                    { basename, kind }
                )
            );

            const { secretsManagerClientExtension } = getSecretsManagerClientExtension(
                secretsManagerClient
            );

            const error = await (
                kind === "secret" ?
                    secretsManagerClient.delete({ path }) :
                    secretsManagerClientExtension.deleteDirectory({ path })
            ).then(
                () => undefined,
                (error: Error) => error
            )

            if (error !== undefined) {

                dispatch(
                    actions.errorOcurred({ "errorMessage": error.message })
                );

            }

        },
    "editCurrentlyShownSecret":
        (params: {
            key: string;

        } & ({
            action: "addOrOverwriteKeyValue";
            value: string
        } | {
            action: "removeKeyValue";
        })): AppThunk => async (...args) => {

            const [dispatch, getState, { secretsManagerClient }] = args;

            dispatch(actions.editSecretStarted(params));

            const { secretsManagerClientExtension } =
                getSecretsManagerClientExtension(secretsManagerClient);

            const { newMetadata } = await secretsManagerClientExtension.editSecret({
                ...params,
                "path": getState().secretExplorer.currentPath
            }).then(id, (error: Error) => ({ "newMetadata": error }));

            dispatch(
                newMetadata instanceof Error ?
                    actions.errorOcurred({ "errorMessage": newMetadata.message }) :
                    actions.editSecretCompleted({ newMetadata })
            );


        }

};

const getSecretsManagerClientExtension = memoize(
    (secretsManagerClient: SecretsManagerClient) => {

        const { crawl } = crawlFactory({
            "list": async ({ directoryPath }) => {

                const {
                    directories,
                    secrets
                } = await secretsManagerClient.list({ "path": directoryPath });

                return {
                    "fileBasenames": secrets,
                    "directoryBasenames": directories
                };

            }
        });

        async function mvSecret(
            params: {
                srcPath: string;
                dstPath: string;
                secret?: Secret;
            }
        ) {

            const {
                srcPath,
                dstPath
            } = params;

            if (pathRelative(srcPath, dstPath) === "") {
                return;
            }

            const {
                secret = (await secretsManagerClient.get({ "path": srcPath })).secret,
            } = params;



            await secretsManagerClient.delete({ "path": srcPath });

            await secretsManagerClient.put({
                "path": dstPath,
                secret
            });


        }

        const secretsManagerClientExtension = {
            "renameSecret": async (
                params: {
                    path: string;
                    newSecretBasename: string;
                    secret?: Secret;
                }
            ) => {

                const {
                    path,
                    newSecretBasename,
                    secret
                } = params;

                await mvSecret({
                    "srcPath": path,
                    "dstPath": pathJoin(pathDirname(path), newSecretBasename),
                    secret
                });

            },
            "renameDirectory": async (
                params: {
                    path: string;
                    newBasename: string;
                }
            ) => {

                const { path, newBasename } = params;

                const { filePaths } = await crawl({ "directoryPath": path });

                await Promise.all(
                    filePaths
                        .map(filePath => mvSecret({
                            "srcPath": pathJoin(path, filePath),
                            "dstPath": pathJoin(pathDirname(path), newBasename, filePath)
                        }))
                );

            },
            "createDirectory": async (
                params: { path: string; }
            ) => {

                const { path } = params;

                await secretsManagerClient.put({
                    "path": pathJoin(path, ".keep"),
                    "secret": {
                        "info": [
                            "This is a dummy secret so that this directory is kept even if there",
                            "is no other secrets in it"
                        ].join(" ")
                    }
                });


            },
            "deleteDirectory": async (
                params: { path: string; }
            ) => {

                const { path } = params;

                const { filePaths } = await crawl({ "directoryPath": path });

                await Promise.all(
                    filePaths
                        .map(filePathRelative => pathJoin(path, filePathRelative))
                        .map(filePath => secretsManagerClient.delete({ "path": filePath }))
                );

            },
            "editSecret": async (
                params: {
                    path: string;
                    key: string;
                } & ({
                    action: "addOrOverwriteKeyValue";
                    value: Secret.Value;
                } | {
                    action: "removeKeyValue";
                })
            ): Promise<{ newMetadata: SecretWithMetadata["metadata"]; }> => {

                const { path } = params;

                const { secret } = await secretsManagerClient.get({ path });

                await secretsManagerClient.delete({ path });

                switch (params.action) {
                    case "addOrOverwriteKeyValue": {
                        const { key, value } = params;

                        secret[key] = value;

                    } break;
                    case "removeKeyValue": {

                        const { key } = params;

                        delete secret[key];

                    } break;
                }

                await secretsManagerClient.put({ path, secret });

                const { metadata } = await secretsManagerClient.get({ path });

                return { "newMetadata": metadata };

            }
        };

        return { secretsManagerClientExtension };

    }
);

export const pure = {
    //TODO!!!
    "getIsValidBasename": (params: { basename: string; }): boolean => {
        const { basename } = params;
        return basename !== "" && !basename.includes(" ")
    }
}



