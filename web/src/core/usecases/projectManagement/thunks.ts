import { assert, type Equals, is } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { join as pathJoin } from "pathe";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { actions, type ChangeConfigValueParams } from "./state";
import { protectedSelectors } from "./selectors";
import * as userConfigs from "core/usecases/userConfigs";
import { same } from "evt/tools/inDepth";
import { id } from "tsafe/id";
import { updateDefaultS3ConfigsAfterPotentialDeletion } from "core/usecases/s3ConfigManagement/decoupledLogic/updateDefaultS3ConfigsAfterPotentialDeletion";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { getProjectVaultTopDirPath_reserved } from "./decoupledLogic/projectVaultTopDirPath_reserved";
import { secretToValue, valueToSecret } from "./decoupledLogic/secretParsing";
import { projectConfigsMigration } from "./decoupledLogic/projectConfigsMigration";
import { symToStr } from "tsafe/symToStr";
import { type ProjectConfigs, zProjectConfigs } from "./decoupledLogic/ProjectConfigs";
import { clearProjectConfigs } from "./decoupledLogic/clearProjectConfigs";
import { Mutex } from "async-mutex";
import { createUsecaseContextApi } from "clean-architecture";

export const thunks = {
    changeProject:
        (params: { projectId: string }) =>
        async (...args) => {
            const [
                dispatch,
                getState,
                { onyxiaApi, secretsManager, paramsOfBootstrapCore }
            ] = args;

            const { projectId } = params;

            const { projects } = await onyxiaApi.getUserAndProjects();

            const { projectVaultTopDirPath, group } = (() => {
                const project = projects.find(({ id }) => id === projectId);

                assert(project !== undefined);

                const { vaultTopDir: projectVaultTopDirPath, group } = project;

                return { projectVaultTopDirPath, group };
            })();

            const prOnboarding = (async () => {
                const sessionStorageKey = "onyxia_onboarded_groups";

                function readSessionStorage(): string[] {
                    const value = sessionStorage.getItem(sessionStorageKey);
                    return value === null ? [] : JSON.parse(value);
                }

                function writeSessionStorage(value: string[]) {
                    sessionStorage.setItem(sessionStorageKey, JSON.stringify(value));
                }

                const onboardedProjectIds = readSessionStorage();

                if (onboardedProjectIds.includes(projectId)) {
                    return;
                }

                await onyxiaApi.onboard({ group });

                writeSessionStorage([...onboardedProjectIds, projectId]);
            })();

            const projectVaultTopDirPath_reserved = getProjectVaultTopDirPath_reserved({
                projectVaultTopDirPath
            });

            await projectConfigsMigration({
                secretsManager,
                projectVaultTopDirPath_reserved
            });

            const { projectConfigs } = await (async function getProjectConfig(): Promise<{
                projectConfigs: ProjectConfigs;
            }> {
                const { files } = await secretsManager
                    .list({
                        path: projectVaultTopDirPath_reserved
                    })
                    .catch(() => {
                        console.log("The above 404 is fine");
                        return { files: id<string[]>([]) };
                    });

                const projectConfigs = Object.fromEntries(
                    await Promise.all(
                        keys.map(async key => {
                            const path = pathJoin(projectVaultTopDirPath_reserved, key);

                            if (!files.includes(key)) {
                                const value = getDefaultConfig(key);

                                await secretsManager.put({
                                    path,
                                    secret: valueToSecret(value)
                                });

                                return [key, value] as const;
                            }

                            const { secret } = await secretsManager.get({ path });

                            return [key, secretToValue(secret)] as const;
                        })
                    )
                );

                try {
                    zProjectConfigs.parse(projectConfigs);
                    assert(is<ProjectConfigs>(projectConfigs));
                } catch {
                    console.warn(
                        "We got a malformed ProjectConfigs object, clearing it...",
                        projectConfigs
                    );

                    await clearProjectConfigs({
                        secretsManager,
                        projectVaultTopDirPath_reserved
                    });

                    return getProjectConfig();
                }

                return { projectConfigs };
            })();

            await prOnboarding;

            maybe_update_pinned_default_s3_configs: {
                const actions = updateDefaultS3ConfigsAfterPotentialDeletion({
                    projectConfigsS3: projectConfigs.s3,
                    s3RegionConfigs:
                        deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        ).s3Configs
                });

                let needUpdate = false;

                for (const propertyName of [
                    "s3ConfigId_defaultXOnyxia",
                    "s3ConfigId_explorer"
                ] as const) {
                    const action = actions[propertyName];

                    if (!action.isUpdateNeeded) {
                        continue;
                    }

                    needUpdate = true;

                    projectConfigs.s3[propertyName] = action.s3ConfigId;
                }

                if (!needUpdate) {
                    break maybe_update_pinned_default_s3_configs;
                }

                {
                    const { s3 } = projectConfigs;

                    await secretsManager.put({
                        path: pathJoin(projectVaultTopDirPath_reserved, symToStr({ s3 })),
                        secret: valueToSecret(s3)
                    });
                }
            }

            const projectWithInjectedPersonalInfos = projects.map(project => ({
                ...project,
                doInjectPersonalInfos:
                    project.group === undefined ||
                    !paramsOfBootstrapCore.disablePersonalInfosInjectionInGroup
            }));

            dispatch(
                actions.projectChanged({
                    projects: projectWithInjectedPersonalInfos,
                    selectedProjectId: projectId,
                    currentProjectConfigs: projectConfigs
                })
            );

            await dispatch(
                userConfigs.thunks.changeValue({
                    key: "selectedProjectId",
                    value: projectId
                })
            );
        },
    renewServicePassword:
        () =>
        async (...args) => {
            const [dispatch] = args;
            await dispatch(
                protectedThunks.updateConfigValue({
                    key: "servicePassword",
                    value: generateRandomPassword()
                })
            );
        }
} satisfies Thunks;

const keys = [
    "__modelVersion",
    "servicePassword",
    "restorableConfigs",
    "s3",
    "clusterNotificationCheckoutTime"
] as const;

assert<Equals<(typeof keys)[number], keyof ProjectConfigs>>();

function getDefaultConfig<K extends keyof ProjectConfigs>(key_: K): ProjectConfigs[K] {
    const key = key_ as keyof ProjectConfigs;
    switch (key) {
        case "__modelVersion": {
            const out: ProjectConfigs[typeof key] = 2;
            // @ts-expect-error
            return out;
        }
        case "servicePassword": {
            const out: ProjectConfigs[typeof key] = generateRandomPassword();
            // @ts-expect-error
            return out;
        }
        case "restorableConfigs": {
            const out: ProjectConfigs[typeof key] = [];
            // @ts-expect-error
            return out;
        }
        case "s3": {
            const out: ProjectConfigs[typeof key] = {
                s3Configs: [],
                // NOTE: We will set to the correct default at initialization
                s3ConfigId_defaultXOnyxia: "a-config-id-that-does-not-exist",
                s3ConfigId_explorer: "a-config-id-that-does-not-exist"
            };
            // @ts-expect-error
            return out;
        }
        case "clusterNotificationCheckoutTime": {
            const out: ProjectConfigs[typeof key] = 0;
            // @ts-expect-error
            return out;
        }
    }
    assert<Equals<typeof key, never>>(false);
}

export const protectedThunks = {
    initialize:
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
                    projectId: selectedProjectId
                })
            );
        },
    updateConfigValue:
        <K extends keyof ProjectConfigs>(params: ChangeConfigValueParams<K>) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { mutex } = getContext(rootContext);

            await mutex.runExclusive(async () => {
                const { secretsManager } = rootContext;

                const currentProjectConfig = protectedSelectors.projectConfig(getState());

                const currentLocalValue = currentProjectConfig[params.key];

                if (same(currentLocalValue, params.value)) {
                    return;
                }

                dispatch(actions.configValueUpdated(params));

                const path = pathJoin(
                    getProjectVaultTopDirPath_reserved({
                        projectVaultTopDirPath:
                            protectedSelectors.currentProject(getState()).vaultTopDir
                    }),
                    params.key
                );

                {
                    const currentRemoteValue = await secretsManager
                        .get({
                            path
                        })
                        .then(({ secret }) => secretToValue(secret) as ProjectConfigs[K]);

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
                    secret: valueToSecret(params.value)
                });
            });
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    mutex: new Mutex()
}));
