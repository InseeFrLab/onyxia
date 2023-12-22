import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { join as pathJoin } from "path";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { actions, type State, type ChangeConfigValueParams } from "./state";
import type { Secret } from "core/ports/SecretsManager";
import { selectors } from "./selectors";
import { createUsecaseContextApi } from "redux-clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import { Mutex } from "async-mutex";
import { same } from "evt/tools/inDepth";

export const thunks = {
    "changeProject":
        (params: { projectId: string }) =>
        async (...args) => {
            const [dispatch, , { onyxiaApi, secretsManager }] = args;

            const { projectId } = params;

            const projects = await onyxiaApi.getUserProjects();

            const projectVaultTopDirPath = (() => {
                const project = projects.find(({ id }) => id === projectId);

                assert(project !== undefined);

                return project.vaultTopDir;
            })();

            await dispatch(privateThunks.__configMigration({ projectVaultTopDirPath }));

            const projectConfigs = Object.fromEntries(
                await Promise.all(
                    keys.map(key =>
                        dispatch(
                            privateThunks.getRemoteConfigValue({
                                projectVaultTopDirPath,
                                key
                            })
                        ).then(value => [key, value] as const)
                    )
                )
            ) as State.ProjectConfigs;

            onboarding: {
                if (projectConfigs.isOnboarded) {
                    break onboarding;
                }

                await onyxiaApi.onboard();

                await secretsManager.put({
                    "path": pathJoin(
                        getProjectConfigVaultDirPath({ projectVaultTopDirPath }),
                        "isOnboarded"
                    ),
                    "secret": valueToSecret(true)
                });
            }

            dispatch(
                actions.projectChanged({
                    projects,
                    "selectedProjectId": projectId,
                    "selectedProjectConfigs": projectConfigs
                })
            );

            await dispatch(
                userConfigs.thunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId
                })
            );
        },
    "renewServicePassword":
        () =>
        async (...args) => {
            const [dispatch] = args;
            await dispatch(
                protectedThunks.updateConfigValue({
                    "key": "servicePassword",
                    "value": generateRandomPassword()
                })
            );
        }
} satisfies Thunks;

const keys = [
    "servicePassword",
    "isOnboarded",
    "restorableConfigs",
    "customS3Configs"
] as const;

assert<Equals<(typeof keys)[number], keyof State.ProjectConfigs>>();

export const privateThunks = {
    "getRemoteConfigValue":
        <K extends keyof State.ProjectConfigs>(params: {
            projectVaultTopDirPath: string;
            key: K;
        }) =>
        async (...args): Promise<State.ProjectConfigs[K]> => {
            const { key, projectVaultTopDirPath } = params;

            const [, , rootContext] = args;

            const { secretsManager } = rootContext;

            const path = pathJoin(
                getProjectConfigVaultDirPath({ projectVaultTopDirPath }),
                key
            );

            let value = await secretsManager
                .get({ path })
                .then(({ secret }) => secretToValue(secret) as State.ProjectConfigs[K])
                .catch(cause => new Error(String(cause), { cause }));

            if (value instanceof Error) {
                value = getDefaultConfig(key);

                const { mutexByKey } = getContext(rootContext);

                await mutexByKey[key].runExclusive(async () =>
                    secretsManager.put({
                        path,
                        "secret": valueToSecret(value)
                    })
                );
            }

            return value;
        },
    "__configMigration":
        (params: { projectVaultTopDirPath: string }) =>
        async (...args) => {
            const { projectVaultTopDirPath } = params;

            const [, , { secretsManager }] = args;

            const projectConfigVaultDirPath = getProjectConfigVaultDirPath({
                projectVaultTopDirPath
            });

            restorableConfigsStr: {
                const path = pathJoin(projectConfigVaultDirPath, "restorableConfigsStr");

                const value = await secretsManager
                    .get({ path })
                    .then(({ secret }) => secret.value as string)
                    .catch(cause => new Error(String(cause), { cause }));

                if (value instanceof Error) {
                    break restorableConfigsStr;
                }

                await secretsManager.delete({ path });

                await secretsManager.put({
                    "path": pathJoin(projectConfigVaultDirPath, "restorableConfigs"),
                    "secret": valueToSecret(JSON.parse(value))
                });
            }
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            const projects = await onyxiaApi.getUserProjects();

            let { selectedProjectId } = userConfigs.selectors.userConfigs(getState());

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;
            }

            await dispatch(
                thunks.changeProject({
                    "projectId": selectedProjectId
                })
            );
        },
    "updateConfigValue":
        <K extends keyof State.ProjectConfigs>(params: ChangeConfigValueParams<K>) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { mutexByKey } = getContext(rootContext);

            const { secretsManager } = rootContext;

            const { id: projectId } = selectors.currentProject(getState());

            await mutexByKey[params.key].runExclusive(async () => {
                if (selectors.currentProject(getState()).id !== projectId) {
                    return;
                }

                const currentLocalValue = selectors.selectedProjectConfigs(getState())[
                    params.key
                ];

                if (same(currentLocalValue, params.value)) {
                    return;
                }

                dispatch(actions.configValueUpdated(params));

                const projectVaultTopDirPath = selectors.currentProject(
                    getState()
                ).vaultTopDir;

                const currentRemoteValue = await dispatch(
                    privateThunks.getRemoteConfigValue({
                        "key": params.key,
                        projectVaultTopDirPath
                    })
                );

                if (!same(currentLocalValue, currentLocalValue)) {
                    alert(
                        [
                            `Someone in the group has updated the value of ${params.key} to`,
                            `${JSON.stringify(currentRemoteValue)}, reloading the page...`
                        ].join(" ")
                    );
                    window.location.reload();
                    return;
                }

                await secretsManager.put({
                    "path": pathJoin(
                        getProjectConfigVaultDirPath({ projectVaultTopDirPath }),
                        params.key
                    ),
                    "secret": valueToSecret(params.value)
                });
            });
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "mutexByKey": Object.fromEntries(keys.map(key => [key, new Mutex()])) as Record<
        keyof State.ProjectConfigs,
        Mutex
    >
}));

function getDefaultConfig<K extends keyof State.ProjectConfigs>(
    key_: K
): State.ProjectConfigs[K] {
    const key = key_ as keyof State.ProjectConfigs;
    switch (key) {
        case "servicePassword": {
            const out: State.ProjectConfigs[typeof key] = generateRandomPassword();
            // @ts-expect-error
            return out;
        }
        case "isOnboarded": {
            const out: State.ProjectConfigs[typeof key] = false;
            // @ts-expect-error
            return out;
        }
        case "restorableConfigs": {
            const out: State.ProjectConfigs[typeof key] = [];
            // @ts-expect-error
            return out;
        }
        case "customS3Configs": {
            const out: State.ProjectConfigs[typeof key] = {
                "availableConfigs": [],
                "indexForExplorer": undefined,
                "indexForXOnyxia": undefined
            };
            // @ts-expect-error
            return out;
        }
    }
    assert<Equals<typeof key, never>>(false);
}

function valueToSecret(value: any): Secret {
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return { "value": value };
    }

    if (value === undefined) {
        return {};
    }

    return { "valueAsJson": JSON.stringify(value) };
}

function secretToValue(secret: Secret): unknown {
    const [key, ...otherKeys] = Object.keys(secret);

    assert(
        (key === undefined || key === "value" || key === "valueAsJson") &&
            otherKeys.length === 0,
        `project config secret should have only one key, either "value" or "valueAsJson", got ${JSON.stringify(
            secret
        )}`
    );

    switch (key) {
        case undefined:
            return undefined;
        case "value":
            return secret[key];
        case "valueAsJson": {
            const valueStr = secret[key];

            assert(typeof valueStr === "string");

            return JSON.parse(valueStr);
        }
    }
}

const getProjectConfigVaultDirPath = (params: { projectVaultTopDirPath: string }) => {
    const { projectVaultTopDirPath } = params;
    return pathJoin(projectVaultTopDirPath, ".onyxia");
};
