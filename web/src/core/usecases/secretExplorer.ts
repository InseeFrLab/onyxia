import "minimal-polyfills/Object.fromEntries";
import { id } from "tsafe/id";
import type { SecretsManager, Secret } from "core/ports/SecretsManager";
import {
    join as pathJoin,
    relative as pathRelative,
    basename as pathBasename
} from "pathe";
import { logApi } from "core/tools/commandLogger";
import { assert } from "tsafe/assert";
import * as projectManagement from "./projectManagement";
import { Evt } from "evt";
import type { Ctx } from "evt";
import type { State as RootState, Thunks, CreateEvt } from "core/bootstrap";
import memoize from "memoizee";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { createExtendedFsApi } from "core/tools/extendedFsApi";
import type { ExtendedFsApi } from "core/tools/extendedFsApi";
import { getVaultCommandLogger } from "core/adapters/secretManager/utils/vaultCommandLogger";
import { createUsecaseActions, createUsecaseContextApi } from "clean-architecture";
// NOTE: Polyfill of a browser feature.
import structuredClone from "@ungap/structured-clone";
import type { WritableDraft } from "clean-architecture/immer";

// All explorer path are expected to be absolute (start with /)

export type State = {
    directoryPath: string | undefined;
    directoryItems: {
        kind: "file" | "directory";
        basename: string;
    }[];
    isNavigationOngoing: boolean;
    ongoingOperations: ({
        directoryPath: string;
        basename: string;
        kind: "file" | "directory";
        operation: "create" | "rename" | "delete";
    } & (
        | {
              operation: "create" | "delete";
          }
        | {
              operation: "rename";
              previousBasename: string;
          }
    ))[];
    commandLogsEntries: {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    }[];
};

export const name = "secretExplorer";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        directoryPath: undefined,
        directoryItems: [],
        isNavigationOngoing: false,
        ongoingOperations: [],
        commandLogsEntries: []
    }),
    reducers: {
        navigationStarted: state => {
            state.isNavigationOngoing = true;
        },
        navigationCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    directoryItems: {
                        kind: "file" | "directory";
                        basename: string;
                    }[];
                };
            }
        ) => {
            const { directoryPath, directoryItems } = payload;

            state.directoryPath = directoryPath;
            state.directoryItems = directoryItems;
            state.isNavigationOngoing = false;

            //Properly restore state when navigating back to
            //a directory with ongoing operations.
            state.ongoingOperations
                .filter(o => pathRelative(o.directoryPath, directoryPath) === "")
                .forEach(o => {
                    switch (o.operation) {
                        case "rename":
                            removeIfPresent(state.directoryItems, {
                                kind: o.kind,
                                basename: o.previousBasename
                            });
                            break;
                        case "delete":
                            removeIfPresent(state.directoryItems, {
                                kind: o.kind,
                                basename: o.basename
                            });
                            break;
                        case "create":
                            break;
                    }
                });
        },
        navigationCanceled: state => {
            state.isNavigationOngoing = false;
        },
        operationStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                } & (
                    | {
                          operation: "create" | "delete";
                      }
                    | {
                          operation: "rename";
                          newBasename: string;
                      }
                );
            }
        ) => {
            const { kind, basename } = payload;

            assert(state.directoryPath !== undefined);

            switch (payload.operation) {
                case "rename":
                case "delete":
                    removeIfPresent(state.directoryItems, { kind, basename });
                    break;
            }

            state.ongoingOperations.push({
                directoryPath: state.directoryPath,
                kind,
                ...(() => {
                    switch (payload.operation) {
                        case "rename":
                            return {
                                operation: payload.operation,
                                basename: payload.newBasename,
                                previousBasename: basename
                            };
                        case "delete":
                        case "create":
                            return {
                                operation: payload.operation,
                                basename
                            };
                    }
                })()
            });
        },
        operationCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                    directoryPath: string;
                };
            }
        ) => {
            const { kind, basename, directoryPath } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    pathRelative(o.directoryPath, directoryPath) === ""
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            if (pathRelative(state.directoryPath, directoryPath) !== "") {
                return;
            }

            switch (ongoingOperation.operation) {
                case "create":
                case "rename":
                    state.directoryItems.push({
                        basename: ongoingOperation.basename,
                        kind
                    });
                    break;
            }
        },
        apiHistoryUpdated: (
            state,
            { payload }: { payload: { commandLogsEntries: State["commandLogsEntries"] } }
        ) => {
            const { commandLogsEntries } = payload;

            state.commandLogsEntries = commandLogsEntries;
        }
    }
});

export type ExplorersCreateParams =
    | ExplorersCreateParams.Directory
    | ExplorersCreateParams.File;

export declare namespace ExplorersCreateParams {
    export type _Common = {
        basename: string;
    };

    export type Directory = _Common & {
        createWhat: "directory";
    };

    export type File = _Common & {
        createWhat: "file";
    };
}

const privateThunks = {
    lazyInitialization:
        () =>
        (...args) => {
            const [dispatch, getState, extraArg] = args;

            if (getIsContextSet(extraArg)) {
                //NOTE: We don't want to initialize twice.
                return;
            }

            const { commandLogs, loggedApi } = logApi({
                api: extraArg.secretsManager,
                commandLogger: getVaultCommandLogger({
                    clientType: "CLI",
                    engine:
                        deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        ).vault?.kvEngine ?? "onyxia-kv"
                })
            });

            commandLogs.evt.toStateful().attach(() =>
                dispatch(
                    actions.apiHistoryUpdated({
                        // NOTE: We spread only for the type.
                        commandLogsEntries: [...structuredClone(commandLogs.history)]
                    })
                )
            );

            setContext(extraArg, {
                loggedSecretClient: loggedApi,
                loggedExtendedFsApi: createExtendedFsApi({
                    baseFsApi: {
                        list: loggedApi.list,
                        deleteFile: loggedApi.delete,
                        downloadFile: async ({ path }) =>
                            (await loggedApi.get({ path })).secret,
                        uploadFile: ({ path, file }) =>
                            loggedApi.put({ path, secret: file })
                    },
                    keepFile: id<Secret>({
                        info: [
                            "This is a dummy secret so that this directory is kept even if there",
                            "is no other secrets in it"
                        ].join(" ")
                    }),
                    keepFileBasename: ".keep"
                })
            });
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    navigate:
        (params: { directoryPath: string; forceReload: boolean }) =>
        async (...args) => {
            const { directoryPath, forceReload } = params;

            const [dispatch, getState, rootContext] = args;

            //Avoid navigating to the current directory.
            if (!forceReload) {
                const currentDirectoryPath = getState()[name].directoryPath;

                if (
                    currentDirectoryPath !== undefined &&
                    pathRelative(currentDirectoryPath, directoryPath) === ""
                ) {
                    return;
                }
            }

            const { loggedSecretClient } = getContext(rootContext);

            dispatch(thunks.cancelNavigation());

            dispatch(actions.navigationStarted());

            const ctx = Evt.newCtx();

            rootContext.evtAction.attach(
                event =>
                    event.usecaseName === "secretExplorer" &&
                    event.actionName === "navigationCanceled",
                ctx,
                () => ctx.done()
            );

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    kind: "directory",
                    directoryPath: pathJoin(directoryPath, ".."),
                    basename: pathBasename(directoryPath),
                    ctx
                })
            );

            const { directories, files } = await Evt.from(
                ctx,
                loggedSecretClient.list({ path: directoryPath })
            ).waitFor();

            ctx.done();

            dispatch(
                actions.navigationCompleted({
                    directoryPath,
                    directoryItems: [
                        ...directories.map(basename => ({
                            basename,
                            kind: "directory" as const
                        })),
                        ...files.map(basename => ({ basename, kind: "file" as const }))
                    ]
                })
            );
        },
    waitForNoOngoingOperation:
        (params: {
            kind: "file" | "directory";
            basename: string;
            directoryPath: string;
            ctx?: Ctx;
        }) =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { kind, basename, directoryPath, ctx = Evt.newCtx() } = params;

            const { ongoingOperations } = getState()[name];

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    o.directoryPath === directoryPath
            );

            if (ongoingOperation === undefined) {
                return;
            }

            await evtAction.waitFor(
                event =>
                    event.usecaseName === "secretExplorer" &&
                    event.actionName === "operationCompleted" &&
                    event.payload.kind === kind &&
                    (event.payload.basename === basename ||
                        (ongoingOperation.operation === "rename" &&
                            event.payload.basename ===
                                ongoingOperation.previousBasename)) &&
                    pathRelative(event.payload.directoryPath, directoryPath) === "",
                ctx
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    getLoggedSecretsApis:
        () =>
        (...args) => {
            const [, , extraArg] = args;

            const { loggedSecretClient, loggedExtendedFsApi } = getContext(extraArg);

            return { loggedSecretClient, loggedExtendedFsApi };
        },
    getHomeDirectoryPath:
        () =>
        (...args) => {
            const [, getState] = args;

            return projectManagement.protectedSelectors.currentProject(getState())
                .vaultTopDir;
        }
} satisfies Thunks;

export const thunks = {
    getProjectHomeOrPreviousPath:
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const homeDirectoryPath = dispatch(protectedThunks.getHomeDirectoryPath());

            const currentDirectoryPath = getState()[name].directoryPath;

            return_current_path: {
                if (currentDirectoryPath === undefined) {
                    //NOTE: First navigation
                    break return_current_path;
                }

                if (!currentDirectoryPath.startsWith(homeDirectoryPath)) {
                    // The project has changed while we where on another page
                    break return_current_path;
                }

                return currentDirectoryPath;
            }

            return homeDirectoryPath;
        },
    navigate:
        (params: { directoryPath: string }) =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            dispatch(privateThunks.lazyInitialization());

            return dispatch(
                privateThunks.navigate({
                    directoryPath,
                    forceReload: false
                })
            );
        },
    //Not used by the UI so far but we want to later
    cancelNavigation:
        () =>
        (...args) => {
            const [dispatch, getState] = args;
            if (!getState()[name].isNavigationOngoing) {
                return;
            }
            dispatch(actions.navigationCanceled());
        },
    refresh:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            if (directoryPath === undefined) {
                return;
            }

            await dispatch(
                privateThunks.navigate({
                    directoryPath,
                    forceReload: true
                })
            );
        },
    rename:
        (params: {
            renamingWhat: "file" | "directory";
            basename: string;
            newBasename: string;
        }) =>
        async (...args) => {
            const { renamingWhat, basename, newBasename } = params;

            const [dispatch, getState, extraArg] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    kind: renamingWhat,
                    directoryPath,
                    basename
                })
            );

            dispatch(
                actions.operationStarted({
                    kind: renamingWhat,
                    basename,
                    operation: "rename",
                    newBasename
                })
            );

            await getContext(extraArg).loggedExtendedFsApi[
                (() => {
                    switch (renamingWhat) {
                        case "file":
                            return "renameFile";
                        case "directory":
                            return "renameDirectory";
                    }
                })()
            ]({
                path: pathJoin(directoryPath, basename),
                newBasename
            });

            dispatch(
                actions.operationCompleted({
                    kind: renamingWhat,
                    basename: newBasename,
                    directoryPath
                })
            );
        },

    create:
        (params: ExplorersCreateParams) =>
        async (...args) => {
            const [dispatch, getState, extraArg] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    kind: params.createWhat,
                    directoryPath,
                    basename: params.basename
                })
            );

            dispatch(
                actions.operationStarted({
                    kind: params.createWhat,
                    basename: params.basename,
                    operation: "create"
                })
            );

            const context = getContext(extraArg);

            const path = pathJoin(directoryPath, params.basename);

            switch (params.createWhat) {
                case "file":
                    await context.loggedSecretClient.put({
                        path,
                        secret: {}
                    });
                    break;
                case "directory":
                    await context.loggedExtendedFsApi.createDirectory({ path });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    kind: params.createWhat,
                    basename: params.basename,
                    directoryPath
                })
            );
        },

    /**
     * Assert:
     * The file or directory we are deleting is present in the directory
     * currently listed.
     */
    delete:
        (params: { deleteWhat: "file" | "directory"; basename: string }) =>
        async (...args) => {
            const { deleteWhat, basename } = params;

            const [dispatch, getState, extraArg] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    kind: deleteWhat,
                    directoryPath,
                    basename
                })
            );

            dispatch(
                actions.operationStarted({
                    kind: params.deleteWhat,
                    basename: params.basename,
                    operation: "delete"
                })
            );

            const context = getContext(extraArg);

            const path = pathJoin(directoryPath, basename);

            switch (deleteWhat) {
                case "directory":
                    await context.loggedExtendedFsApi.deleteDirectory({ path });
                    break;
                case "file":
                    await context.loggedSecretClient.delete({
                        path
                    });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    kind: deleteWhat,
                    basename,
                    directoryPath
                })
            );
        },
    getIsEnabled:
        () =>
        (...args) => {
            const [, getState] = args;

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            return region.vault !== undefined;
        }
} satisfies Thunks;

type Context = {
    loggedSecretClient: SecretsManager;
    loggedExtendedFsApi: ExtendedFsApi;
};

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<Context>();

function removeIfPresent(
    directoryItems: WritableDraft<{
        kind: "file" | "directory";
        basename: string;
    }>[],
    item: { kind: "file" | "directory"; basename: string }
): void {
    const index = directoryItems.findIndex(
        item_i => item_i.kind === item.kind && item_i.basename === item.basename
    );

    assert(index >= 0);

    directoryItems.splice(index, 1);
}

export const selectors = (() => {
    type CurrentWorkingDirectoryView = {
        directoryPath: string;
        isNavigationOngoing: boolean;
        directories: string[];
        files: string[];
        directoriesBeingCreated: string[];
        directoriesBeingRenamed: string[];
        filesBeingCreated: string[];
        filesBeingRenamed: string[];
    };

    const currentWorkingDirectoryView = (
        rootState: RootState
    ): CurrentWorkingDirectoryView | undefined => {
        const state = rootState[name];

        const { directoryPath, isNavigationOngoing, directoryItems, ongoingOperations } =
            state;

        return ((): CurrentWorkingDirectoryView | undefined => {
            if (directoryPath === undefined) {
                return undefined;
            }

            return {
                directoryPath,
                isNavigationOngoing,
                ...(() => {
                    const selectOngoing = memoize(
                        (kind: "directory" | "file", operation: "create" | "rename") =>
                            ongoingOperations
                                .filter(
                                    o =>
                                        o.directoryPath === directoryPath &&
                                        o.kind === kind &&
                                        o.operation === operation
                                )
                                .map(({ basename }) => basename)
                    );

                    const select = (kind: "directory" | "file") =>
                        [
                            ...directoryItems
                                .filter(item => item.kind === kind)
                                .map(({ basename }) => basename),
                            ...selectOngoing(kind, "create"),
                            ...selectOngoing(kind, "rename")
                        ].sort((a, b) => a.localeCompare(b));

                    return {
                        directories: select("directory"),
                        files: select("file"),
                        directoriesBeingCreated: selectOngoing("directory", "create"),
                        directoriesBeingRenamed: selectOngoing("directory", "rename"),
                        filesBeingCreated: selectOngoing("file", "create"),
                        filesBeingRenamed: selectOngoing("file", "rename")
                    };
                })()
            };
        })();
    };

    const commandLogsEntries = (rootState: RootState) =>
        rootState[name].commandLogsEntries;

    return { currentWorkingDirectoryView, commandLogsEntries };
})();

export const createEvt = (({ evtAction }) => {
    const evt = Evt.create<{
        action: "reset path";
    }>();

    evtAction.attach(
        action =>
            action.usecaseName === "projectManagement" &&
            action.actionName === "projectChanged",
        () =>
            evt.post({
                action: "reset path"
            })
    );

    return evt;
}) satisfies CreateEvt;
