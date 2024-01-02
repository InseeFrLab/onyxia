import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { join as pathJoin } from "path";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { actions, type State, type ChangeConfigValueParams } from "./state";
import type { Secret } from "core/ports/SecretsManager";
import { selectors } from "./selectors";
import * as userConfigs from "core/usecases/userConfigs";
import { same } from "evt/tools/inDepth";

export const thunks = {
    "changeProject":
        (params: { projectId: string }) =>
        async (...args) => {
            const [dispatch, , { onyxiaApi, secretsManager }] = args;

            const { projectId } = params;

            const { projects } = await onyxiaApi.getUserAndProjects();

            const { projectVaultTopDirPath, group } = (() => {
                const project = projects.find(({ id }) => id === projectId);

                assert(project !== undefined);

                const { vaultTopDir: projectVaultTopDirPath, group } = project;

                return { projectVaultTopDirPath, group };
            })();

            await dispatch(privateThunks.__configMigration({ projectVaultTopDirPath }));

            const projectConfigVaultDirPath = getProjectConfigVaultDirPath({
                projectVaultTopDirPath
            });

            const { files } = await secretsManager.list({
                "path": projectConfigVaultDirPath
            });

            const projectConfigs: State.ProjectConfigs = Object.fromEntries(
                await Promise.all(
                    keys.map(async key => {
                        if (!files.includes(key)) {
                            if (key === "onboardingTimestamp") {
                                await onyxiaApi.onboard({ group });
                            }

                            const value = getDefaultConfig(key);

                            await secretsManager.put({
                                "path": pathJoin(projectConfigVaultDirPath, key),
                                "secret": valueToSecret(value)
                            });

                            return [key, value] as const;
                        }

                        const { secret } = await secretsManager.get({
                            "path": pathJoin(projectConfigVaultDirPath, key)
                        });

                        return [key, secretToValue(secret)] as const;
                    })
                )
            ) as any;

            dispatch(
                actions.projectChanged({
                    projects,
                    "selectedProjectId": projectId,
                    "currentProjectConfigs": projectConfigs
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
    "onboardingTimestamp",
    "restorableConfigs",
    "customS3Configs"
] as const;

assert<Equals<(typeof keys)[number], keyof State.ProjectConfigs>>();

export const privateThunks = {
    "__configMigration":
        (params: { projectVaultTopDirPath: string }) =>
        async (...args) => {
            const { projectVaultTopDirPath } = params;

            const [, , { secretsManager }] = args;

            const projectConfigVaultDirPath = getProjectConfigVaultDirPath({
                projectVaultTopDirPath
            });

            const { files } = await secretsManager.list({
                "path": projectConfigVaultDirPath
            });

            restorableConfigsStr: {
                if (!files.includes("restorableConfigsStr")) {
                    break restorableConfigsStr;
                }

                const path = pathJoin(projectConfigVaultDirPath, "restorableConfigsStr");

                const value = await secretsManager
                    .get({ path })
                    .then(({ secret }) => secret.value as string | null)
                    .catch(cause => new Error(String(cause), { cause }));

                if (value instanceof Error) {
                    break restorableConfigsStr;
                }

                await secretsManager.delete({ path });

                if (value === null) {
                    break restorableConfigsStr;
                }

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

            const { projects } = await onyxiaApi.getUserAndProjects();

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

            const { secretsManager } = rootContext;

            const { id: projectId } = selectors.currentProject(getState());

            if (selectors.currentProject(getState()).id !== projectId) {
                return;
            }

            const currentLocalValue = selectors.currentProjectConfigs(getState())[
                params.key
            ];

            if (same(currentLocalValue, params.value)) {
                return;
            }

            dispatch(actions.configValueUpdated(params));

            const path = pathJoin(
                getProjectConfigVaultDirPath({
                    "projectVaultTopDirPath": selectors.currentProject(getState())
                        .vaultTopDir
                }),
                params.key
            );

            {
                const currentRemoteValue = await secretsManager
                    .get({
                        path
                    })
                    .then(
                        ({ secret }) => secretToValue(secret) as State.ProjectConfigs[K]
                    );

                if (!same(currentLocalValue, currentRemoteValue)) {
                    alert(
                        [
                            `Someone in the group has updated the value of ${params.key} to`,
                            `${JSON.stringify(currentRemoteValue)}, reloading the page...`
                        ].join(" ")
                    );
                    window.location.reload();
                    return;
                }
            }

            await secretsManager.put({
                path,
                "secret": valueToSecret(params.value)
            });
        }
} satisfies Thunks;

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
        case "onboardingTimestamp": {
            const out: State.ProjectConfigs[typeof key] = Date.now();
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
