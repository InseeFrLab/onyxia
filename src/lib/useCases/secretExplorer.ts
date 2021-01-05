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
import { unwrapWritableDraft } from "lib/utils/unwrapWritableDraft";

const getEvtIsCreatingOrRenaming = memoize(
    (_: Dependencies) => Evt.create(false)
);


export declare type SecretExplorerState =
    SecretExplorerState.Failure |
    SecretExplorerState.ShowingDirectory |
    SecretExplorerState.ShowingSecret
    ;

export declare namespace SecretExplorerState {

    export type _Common = {
        currentPath: string;
        directories: string[];
        secrets: string[];
        isNavigationOngoing: boolean;
    };

    export type Failure = _Common & {
        state: "FAILURE";
        errorMessage: string;
    };

    export type ShowingDirectory = _Common & {
        state: "SHOWING DIRECTORY";
        directoriesBeingCreated: string[];
        directoriesBeingRenamed: string[];
        secretsBeingCreated: string[];
        secretsBeingRenamed: string[];
    };

    export type ShowingSecret = _Common & {
        state: "SHOWING SECRET";
        secretWithMetadata: SecretWithMetadata;
        isBeingRenamed: boolean;
        isBeingUpdated: boolean;
    };



}


export type EditSecretParams = {
    key: string;
} & ({
    action: "addOrOverwriteKeyValue";
    value: string
} | {
    action: "renameKey";
    newKey: string;
} | {
    action: "renameKeyAndUpdateValue";
    newKey: string;
    newValue: string;
} | {
    action: "removeKeyValue";
});


export const name = "secretExplorer";

const { reducer, actions } = createSlice({
    name,
    "initialState": id<SecretExplorerState>(
        id<SecretExplorerState.ShowingDirectory>({
            "state": "SHOWING DIRECTORY",
            "currentPath": "",
            "directories": [],
            "secrets": [],
            "directoriesBeingCreated": [],
            "directoriesBeingRenamed": [],
            "secretsBeingCreated": [],
            "secretsBeingRenamed": [],
            "isNavigationOngoing": true
        })
    ),
    "reducers": {
        "errorOcurred": (
            state,
            { payload }: PayloadAction<{ errorMessage: string; }>
        ) => {

            const { errorMessage } = payload;

            const { directories, secrets, isNavigationOngoing } = state;

            return id<SecretExplorerState.Failure>({
                "state": "FAILURE",
                "currentPath": state.currentPath,
                errorMessage,
                directories,
                secrets,
                isNavigationOngoing
            });

        },
        "navigationStarted": (
            state
        ) => {

            state.isNavigationOngoing = true;

        },
        "navigationTowardDirectorySuccess": (
            _state,
            { payload }: PayloadAction<Pick<SecretExplorerState.ShowingDirectory, "directories" | "secrets" | "currentPath">>
        ) => {

            const { directories, secrets, currentPath } = payload;

            return id<SecretExplorerState.ShowingDirectory>({
                "state": "SHOWING DIRECTORY",
                currentPath,
                directories,
                secrets,
                "directoriesBeingCreated": [],
                "directoriesBeingRenamed": [],
                "secretsBeingCreated": [],
                "secretsBeingRenamed": [],
                "isNavigationOngoing": false
            });

        },
        "navigationTowardSecretSuccess": (
            state,
            { payload }: PayloadAction<Pick<SecretExplorerState.ShowingSecret, "secretWithMetadata" | "currentPath">>
        ) => {

            const { secretWithMetadata, currentPath } = payload;

            const { directories, secrets } = state;

            return id<SecretExplorerState.ShowingSecret>({
                "state": "SHOWING SECRET",
                currentPath,
                secretWithMetadata,
                "isBeingRenamed": false,
                secrets,
                directories,
                "isBeingUpdated": false,
                "isNavigationOngoing": false
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
                    case "secret": return "secretsBeingRenamed";
                    case "directory": return "directoriesBeingRenamed";
                }
            })()].push(newBasename);


        },
        "renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted": (
            state,
            { payload }: PayloadAction<{ basename: string; kind: "secret" | "directory"; action: "rename" | "create" }>
        ) => {

            const { basename, kind, action } = payload;

            assert(state.state === "SHOWING DIRECTORY");

            const relevantArray = state[(() => {
                switch (kind) {
                    case "secret": 
                    switch(action){
                        case "create": return "secretsBeingCreated";
                        case "rename": return "secretsBeingRenamed";
                    }
                    break;
                    case "directory": 
                    switch(action){
                        case "create": return "directoriesBeingCreated";
                        case "rename": return "directoriesBeingRenamed";
                    }
                    break;
                }
            })()];

            relevantArray.splice(relevantArray.indexOf(basename), 1);

        },
        "createSecretOrDirectoryStarted": (
            state,
            { payload }: PayloadAction<{ basename: string; kind: "secret" | "directory"; }>
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
                    case "secret": return "secretsBeingCreated";
                    case "directory": return "directoriesBeingCreated";
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
            { payload }: PayloadAction<EditSecretParams>
        ) => {

            assert(state.state === "SHOWING SECRET");

            const { key } = payload;

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function
            const { secret } = unwrapWritableDraft(state).secretWithMetadata;

            //By doing that we preserve the ordering of the 
            //properties in the record. 
            const renameKey = (params: { newKey: string; }) => {

                const { newKey } = params;

                const secretClone = { ...secret };

                Object.keys(secretClone).forEach(key => { delete secret[key] });

                Object.keys(secretClone)
                    .forEach(key_i =>
                        secret[key_i === key ? newKey : key_i] =
                        secretClone[key_i]
                    );

            };

            switch (payload.action) {
                case "addOrOverwriteKeyValue": {
                    const { value } = payload;
                    secret[key] = value;
                } break;
                case "removeKeyValue":
                    delete secret[key];
                    break;
                case "renameKeyAndUpdateValue": {
                    const { newKey, newValue } = payload;

                    renameKey({ newKey });
                    secret[newKey] = newValue;

                } break;
                case "renameKey": {
                    const { newKey } = payload;
                    renameKey({ newKey });
                } break;
            }

            state.isBeingUpdated = true;

        },
        "editSecretCompleted": state => {

            if (state.state !== "SHOWING SECRET") {
                return;
            }

            const { metadata } = state.secretWithMetadata;

            metadata.created_time = new Date().toISOString();
            metadata.version++;

            state.isBeingUpdated = false;

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

            dispatch(actions.navigationStarted());

            await getEvtIsCreatingOrRenaming(dependencies)
                .waitFor(isCreatingOrRenaming => !isCreatingOrRenaming);

            const directoryPath = pathJoin(getState().secretExplorer.currentPath, directoryRelativePath);

            const listResult = await secretsManagerClient.list({ "path": directoryPath })
                .catch((error: Error) => error);

            dispatch(
                listResult instanceof Error ?
                    actions.errorOcurred({ "errorMessage": listResult.message }) :
                    actions.navigationTowardDirectorySuccess({ ...listResult, "currentPath": directoryPath })
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

            dispatch(actions.navigationStarted());

            await getEvtIsCreatingOrRenaming(dependencies)
                .waitFor(isCreatingOrRenaming => !isCreatingOrRenaming);

            const secretPath = pathJoin(getState().secretExplorer.currentPath, secretRelativePath);

            const secretWithMetadata = await secretsManagerClient.get({ "path": secretPath })
                .catch((error: Error) => error);

            dispatch(
                secretWithMetadata instanceof Error ?
                    actions.errorOcurred({ "errorMessage": secretWithMetadata.message }) :
                    actions.navigationTowardSecretSuccess({ secretWithMetadata, "currentPath": secretPath })
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
                        { "basename": newBasename, kind, "action": "rename" }
                    )
            );

            {

                const { secretExplorer: state } = getState();

                assert(state.state === "SHOWING DIRECTORY");

                if (
                    [
                    ...state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingCreated";
                            case "secret": return "secretsBeingCreated";
                        }
                    })()],
                    ...state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingRenamed";
                            case "secret": return "secretsBeingRenamed";
                        }
                    })()]
                    ].length !== 0
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
            );

            dispatch(
                error !== undefined ?
                    actions.errorOcurred({ "errorMessage": error.message }) :
                    actions.renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted(
                        { basename, kind, "action": "create" }
                    )
            );

            {

                const { secretExplorer: state } = getState();

                assert(state.state === "SHOWING DIRECTORY");

                if (
                    [
                    ...state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingCreated";
                            case "secret": return "secretsBeingCreated";
                        }
                    })()],
                    ...state[(() => {
                        switch (kind) {
                            case "directory": return "directoriesBeingRenamed";
                            case "secret": return "secretsBeingRenamed";
                        }
                    })()]
                    ].length !== 0
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
        (params: EditSecretParams): AppThunk => async (...args) => {

            const [dispatch, , { secretsManagerClient }] = args;

            const getSecretAndCurrentPath = () => {

                const [, getState] = args;

                const state = getState().secretExplorer;

                assert(state.state === "SHOWING SECRET");

                const { secret } = state.secretWithMetadata;

                return {
                    "path": state.currentPath,
                    secret
                };

            };

            //Optimizations
            {


                const { key } = params;
                const { secret } = getSecretAndCurrentPath();

                switch (params.action) {
                    case "addOrOverwriteKeyValue": {
                        const { value } = params;
                        if (secret[key] === value) {
                            return;
                        }
                    } break;
                    case "renameKey": {
                        const { newKey } = params;
                        if (key === newKey) {
                            return;
                        }
                    } break;
                    case "renameKeyAndUpdateValue": {
                        const { newKey, newValue } = params;
                        if (
                            key === newKey &&
                            secret[key] === newValue
                        ) {
                            return;
                        }
                    } break;
                    case "removeKeyValue":
                        if (!(key in secret)) {
                            return;
                        }
                        break;

                }

            }

            dispatch(actions.editSecretStarted(params));

            const error = await secretsManagerClient.put(getSecretAndCurrentPath())
                .then(
                    () => undefined,
                    (error: Error) => error
                );

            dispatch(
                error !== undefined ?
                    actions.errorOcurred({ "errorMessage": error.message }) :
                    actions.editSecretCompleted()
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
};



