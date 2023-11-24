import { type FormFieldValue } from "./launcher/FormField";
import type { RestorableConfig } from "./restorableConfigManager";
import { assert, type Equals } from "tsafe/assert";
import type { Project } from "../ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import type { State as RootState, CreateEvt, Thunks } from "core/bootstrap";
import * as userConfigs from "./userConfigs";
import { join as pathJoin } from "path";
import type { Id } from "tsafe/id";
import { is } from "tsafe/is";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { Chart } from "core/ports/OnyxiaApi";
import { exclude } from "tsafe/exclude";

type State = {
    projects: Project[];
    selectedProjectId: string;
    isOnboarding: boolean;
};

export type ProjectConfigs = Id<
    Record<string, string | boolean | number | null>,
    {
        servicePassword: string;
        isOnboarded: boolean;
        restorableConfigsStr: string | null;
    }
>;

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof ProjectConfigs & keyof userConfigs.UserConfigs, never>>(true);

export const name = "projectConfigs";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialized": (_, { payload }: { payload: State }) => payload,
        "projectChanged": (state, { payload }: { payload: { projectId: string } }) => {
            const { projectId } = payload;

            state.selectedProjectId = projectId;
        },
        "onboardingStarted": state => {
            state.isOnboarding = true;
        },
        "onboardingCompleted": state => {
            state.isOnboarding = false;
        }
    }
});

export const thunks = {
    "changeProject":
        (params: {
            projectId: string;
            /** Default false, only use if we reload just after */
            doPreventDispatch?: boolean;
        }) =>
        async (...args) => {
            const [dispatch] = args;

            const { projectId, doPreventDispatch = false } = params;

            await dispatch(
                userConfigs.thunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId
                })
            );

            if (doPreventDispatch) {
                return;
            }

            dispatch(actions.projectChanged({ projectId }));
        },

    "renewServicePassword":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(
                protectedThunks.changeConfigValue({
                    "key": "servicePassword",
                    "value": getDefaultConfig("servicePassword")
                })
            );
        },
    "getServicesPassword":
        () =>
        async (...args): Promise<string> => {
            const [dispatch] = args;

            const servicePassword = await dispatch(
                protectedThunks.getConfigValue({ "key": "servicePassword" })
            );

            return servicePassword;
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, evtAction }] = args;

            evtAction.attach(
                data =>
                    data.usecaseName === name &&
                    (data.actionName === "initialized" ||
                        data.actionName === "projectChanged"),
                async () => {
                    const isOnboarded = await dispatch(
                        protectedThunks.getConfigValue({ "key": "isOnboarded" })
                    );

                    if (isOnboarded) {
                        return;
                    }

                    dispatch(actions.onboardingStarted());

                    await onyxiaApi.onboard();

                    await dispatch(
                        protectedThunks.changeConfigValue({
                            "key": "isOnboarded",
                            "value": true
                        })
                    );

                    dispatch(actions.onboardingCompleted());
                }
            );

            const projects = await onyxiaApi.getUserProjects();

            let selectedProjectId = getState().userConfigs.selectedProjectId.value;

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;

                await dispatch(
                    userConfigs.thunks.changeValue({
                        "key": "selectedProjectId",
                        "value": selectedProjectId
                    })
                );
            }

            dispatch(
                actions.initialized({
                    projects,
                    selectedProjectId,
                    "isOnboarding": false
                })
            );
        },
    /**
    Here no state because other project user may have changed 
    the values here at any time. Unlike in userConfigs we
    can't assume that the values haven't changed since last fetch.
    We expose a non-reactive API to force the UI dev to take 
    that into account.
    */
    "changeConfigValue":
        <K extends keyof ProjectConfigs>(params: ChangeConfigValueParams<K>) =>
        async (...args) => {
            const [dispatch, , { secretsManager }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            await secretsManager.put({
                "path": pathJoin(dirPath, params.key),
                "secret": { "value": params.value }
            });
        },
    "getConfigValue":
        <K extends keyof ProjectConfigs>(params: { key: K }) =>
        async (...args): Promise<ProjectConfigs[K]> => {
            const { key } = params;

            const [dispatch, , { secretsManager }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            let value = await secretsManager
                .get({ "path": pathJoin(dirPath, key) })
                .then(({ secret }) => secret["value"] as ProjectConfigs[K])
                .catch(() => undefined);

            {
                const { hasMigrationBeenPerformed } = await dispatch(
                    privateThunks.__migration({ key, value })
                );

                if (hasMigrationBeenPerformed) {
                    value = await secretsManager
                        .get({ "path": pathJoin(dirPath, key) })
                        .then(({ secret }) => secret["value"] as ProjectConfigs[K]);
                }
            }

            if (value === undefined) {
                value = getDefaultConfig(key);

                await dispatch(
                    protectedThunks.changeConfigValue({
                        key,
                        value
                    })
                );
            }

            return value;
        }
} satisfies Thunks;

const privateThunks = {
    "getDirPath":
        () =>
        (...args): string => {
            const [, getState] = args;

            const project = selectors.selectedProject(getState());

            return pathJoin("/", project.vaultTopDir, ".onyxia");
        },
    /** We wish we could start from a blank late each time we upgrade onyxia
     *  but we can't because we don't want to erase the user's data
     *  so when we update the model related to things stored in vault we need to im
     *  implement a migration system.
     */
    "__migration":
        <K extends keyof ProjectConfigs>(params: {
            key: K;
            value: ProjectConfigs[K] | undefined;
        }) =>
        async (...args): Promise<{ hasMigrationBeenPerformed: boolean }> => {
            const { key, value } = params;

            const [dispatch, getState, { secretsManager, onyxiaApi }] = args;

            let hasMigrationBeenPerformed = false;

            migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr: {
                if (key !== "restorableConfigsStr") {
                    break migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr;
                }

                if (value !== undefined) {
                    break migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr;
                }

                {
                    const { projects, selectedProjectId } = getState()[name];

                    const userProject = projects.find(
                        project => project.group === undefined
                    );

                    assert(userProject !== undefined);

                    if (userProject.id !== selectedProjectId) {
                        break migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr;
                    }
                }

                const dirPath = dispatch(privateThunks.getDirPath());

                const oldPath = pathJoin(dirPath, "bookmarkedServiceConfigurationStr");

                const oldValue = await secretsManager
                    .get({ "path": oldPath })
                    .then(({ secret }) => secret["value"])
                    .catch(() => undefined);

                if (oldValue === undefined) {
                    break migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr;
                }
                assert(typeof oldValue === "string" || oldValue === null);

                if (oldValue === null) {
                    await secretsManager.delete({ "path": oldPath });
                    break migration_bookmarkedServiceConfigurationStr_to_restorableConfigsStr;
                }

                const bookmarkedServiceConfiguration: {
                    catalogId: string;
                    packageName: string;
                    formFieldsValueDifferentFromDefault: any[];
                }[] = JSON.parse(oldValue);

                const restorableConfigs: {
                    catalogId: string;
                    chartName: string;
                    formFieldsValueDifferentFromDefault: any[];
                }[] = bookmarkedServiceConfiguration.map(
                    ({
                        catalogId,
                        packageName,
                        formFieldsValueDifferentFromDefault
                    }) => ({
                        catalogId,
                        "chartName": packageName,
                        formFieldsValueDifferentFromDefault
                    })
                );

                const newValue = JSON.stringify(restorableConfigs);

                await secretsManager.put({
                    "path": pathJoin(dirPath, key),
                    "secret": { "value": newValue }
                });

                await secretsManager.delete({ "path": oldPath });

                hasMigrationBeenPerformed = true;
            }

            add_version_to_restorable_configs: {
                if (key !== "restorableConfigsStr") {
                    break add_version_to_restorable_configs;
                }

                assert(is<string | null | undefined>(value));

                if (value === undefined || value === null) {
                    break add_version_to_restorable_configs;
                }

                const legacyRestorableConfigs:
                    | {
                          catalogId: string;
                          chartName: string;
                          formFieldsValueDifferentFromDefault: FormFieldValue[];
                      }[]
                    | RestorableConfig[] = JSON.parse(value);

                if (
                    legacyRestorableConfigs.length === 0 ||
                    "chartVersion" in legacyRestorableConfigs[0]
                ) {
                    break add_version_to_restorable_configs;
                }

                assert(!is<RestorableConfig[]>(legacyRestorableConfigs));

                console.log("Migrating restorableConfigsStr to add version");

                const { chartsByCatalogId } = await onyxiaApi.getCatalogsAndCharts();

                const restorableConfigs: RestorableConfig[] = legacyRestorableConfigs
                    .map(
                        ({
                            catalogId,
                            chartName,
                            formFieldsValueDifferentFromDefault
                        }) => {
                            const charts = chartsByCatalogId[catalogId];

                            if (charts === undefined) {
                                console.log(
                                    `Dropping restorable config because catalog ${catalogId} not found`
                                );
                                return undefined;
                            }

                            const chart = charts.find(({ name }) => name === chartName);

                            if (chart === undefined) {
                                console.log(
                                    `Dropping restorable config because chart ${catalogId}/${chartName} not found`
                                );
                                return undefined;
                            }

                            return {
                                catalogId,
                                chartName,
                                formFieldsValueDifferentFromDefault,
                                "chartVersion": Chart.getDefaultVersion(chart)
                            };
                        }
                    )
                    .filter(exclude(undefined));

                const newValue = JSON.stringify(restorableConfigs);

                const dirPath = dispatch(privateThunks.getDirPath());

                await secretsManager.put({
                    "path": pathJoin(dirPath, key),
                    "secret": { "value": newValue }
                });

                hasMigrationBeenPerformed = true;
            }

            return { hasMigrationBeenPerformed };
        }
} satisfies Thunks;

export const selectors = (() => {
    const selectedProject = (rootState: RootState): Project => {
        const state = rootState[name];
        const { projects, selectedProjectId } = state;

        const selectedProject = projects.find(({ id }) => id === selectedProjectId);

        assert(selectedProject !== undefined);

        return selectedProject;
    };

    /** Undefined if use not authenticated */
    const main = (rootState: RootState): State | undefined => {
        if (!rootState.userAuthentication.isUserLoggedIn) {
            return undefined;
        }

        return rootState[name];
    };

    return { selectedProject, main };
})();

function getDefaultConfig<K extends keyof ProjectConfigs>(key_: K): ProjectConfigs[K] {
    const key = key_ as keyof ProjectConfigs;
    switch (key) {
        case "servicePassword": {
            const out: ProjectConfigs[typeof key] = generateRandomPassword();

            // @ts-expect-error
            return out;
        }
        case "isOnboarded": {
            const out: ProjectConfigs[typeof key] = false;
            // @ts-expect-error
            return out;
        }
        case "restorableConfigsStr": {
            const out: ProjectConfigs[typeof key] = null;
            // @ts-expect-error
            return out;
        }
    }

    assert<Equals<typeof key, never>>(false);
}

export type ChangeConfigValueParams<
    K extends keyof ProjectConfigs = keyof ProjectConfigs
> = {
    key: K;
    value: ProjectConfigs[K];
};

export const createEvt = (({ evtAction }) =>
    evtAction.pipe(action =>
        action.usecaseName === name && action.actionName === "projectChanged"
            ? [
                  {
                      "actionName": action.actionName,
                      "projectId": action.payload.projectId
                  }
              ]
            : null
    )) satisfies CreateEvt;
