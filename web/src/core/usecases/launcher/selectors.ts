import type { State as RootState } from "core/bootstrap";
import { assert } from "tsafe/assert";
import * as yaml from "yaml";
import { name } from "./state";
import * as restorableConfigManagement from "core/usecases/restorableConfigManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { exclude } from "tsafe/exclude";
import { createSelector } from "clean-architecture";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { id } from "tsafe/id";
import { computeRootForm } from "./decoupledLogic";
import { computeDiff } from "core/tools/Stringifyable";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return null;
    }

    return state;
};

const isReady = createSelector(readyState, state => state !== null);

const chartName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.chartName;
});

const friendlyName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.friendlyName;
});

const helmValues = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.helmValues;
});

const paramsOfComputeRootForm_butHelmValues = createSelector(
    isReady,
    chartName,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.helmValuesSchema;
    }),
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.helmDependencies;
    }),
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.xOnyxiaContext;
    }),
    (isReady, chartName, helmValuesSchema, helmDependencies, xOnyxiaContext) => {
        if (!isReady) {
            return null;
        }

        assert(chartName !== null);
        assert(helmValuesSchema !== null);
        assert(helmDependencies !== null);
        assert(xOnyxiaContext !== null);

        return { chartName, helmValuesSchema, helmDependencies, xOnyxiaContext };
    }
);

const rootForm = createSelector(
    isReady,
    paramsOfComputeRootForm_butHelmValues,
    helmValues,
    (isReady, computeRootFormParams_butHelmValues, helmValues) => {
        if (!isReady) {
            return null;
        }

        assert(computeRootFormParams_butHelmValues !== null);
        assert(helmValues !== null);

        const { chartName, helmValuesSchema, helmDependencies, xOnyxiaContext } =
            computeRootFormParams_butHelmValues;

        return computeRootForm({
            chartName,
            helmValuesSchema,
            helmValues,
            xOnyxiaContext,
            helmDependencies
        });
    }
);

const catalogId = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.catalogId;
});

const chartVersion = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.chartVersion;
});

const s3ConfigSelect = createSelector(
    s3ConfigManagement.selectors.s3Configs,
    isReady,
    projectManagement.selectors.canInjectPersonalInfos,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.s3Config;
    }),
    (s3Configs, isReady, canInjectPersonalInfos, s3Config) => {
        if (!isReady) {
            return null;
        }

        assert(s3Config !== null);

        // If the chart at hand does not use s3, we don't display the s3 config selector
        if (!s3Config.isChartUsingS3) {
            return undefined;
        }

        const availableConfigs = s3Configs.filter(
            config => canInjectPersonalInfos || config.origin !== "deploymentRegion"
        );

        // We don't display the s3 config selector if there is no config or only one
        if (s3Configs.length <= 1) {
            return undefined;
        }

        return {
            options: availableConfigs.map(s3Config => ({
                optionValue: s3Config.id,
                label: {
                    dataSource: s3Config.dataSource,
                    friendlyName:
                        s3Config.origin === "project" ? s3Config.friendlyName : undefined
                }
            })),
            selectedOptionValue: s3Config.s3ConfigId
        };
    }
);

const isShared = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.isShared;
});

const restorableConfig = createSelector(
    isReady,
    friendlyName,
    isShared,
    catalogId,
    chartName,
    chartVersion,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.s3Config.isChartUsingS3 ? state.s3Config.s3ConfigId : undefined;
    }),
    helmValues,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.helmValues_default;
    }),
    (
        isReady,
        friendlyName,
        isShared,
        catalogId,
        chartName,
        chartVersion,
        s3ConfigId,
        helmValues,
        helmValues_default
    ): projectManagement.ProjectConfigs.RestorableServiceConfig | null => {
        if (!isReady) {
            return null;
        }

        assert(catalogId !== null);
        assert(friendlyName !== null);
        assert(isShared !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(s3ConfigId !== null);
        assert(helmValues !== null);
        assert(helmValues_default !== null);

        const { diffPatch } = computeDiff({
            before: helmValues_default,
            current: helmValues
        });

        return {
            catalogId,
            chartName,
            friendlyName,
            isShared,
            chartVersion,
            s3ConfigId,
            helmValuesPatch: diffPatch
        };
    }
);

const isRestorableConfigSaved = createSelector(
    isReady,
    restorableConfig,
    restorableConfigManagement.selectors.restorableConfigs,
    (isReady, restorableConfig, restorableConfigs) => {
        if (!isReady) {
            return null;
        }

        assert(restorableConfig !== null);

        return (
            restorableConfigs.find(savedRestorableConfig =>
                restorableConfigManagement.getAreSameRestorableConfig(
                    savedRestorableConfig,
                    restorableConfig
                )
            ) !== undefined
        );
    }
);

const isDefaultConfiguration = createSelector(
    isReady,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.friendlyName_default;
    }),
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.chartVersion_default;
    }),
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.isShared_default;
    }),
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        const { s3Config } = state;
        return s3Config.isChartUsingS3 ? s3Config.s3ConfigId_default : undefined;
    }),
    restorableConfig,
    (
        isReady,
        friendlyName_default,
        chartVersion_default,
        isShared_default,
        s3ConfigId_default,
        restorableConfig
    ) => {
        if (!isReady) {
            return null;
        }
        assert(friendlyName_default !== null);
        assert(chartVersion_default !== null);
        assert(isShared_default !== null);
        assert(s3ConfigId_default !== null);
        assert(restorableConfig !== null);

        return (
            restorableConfig.chartVersion === chartVersion_default &&
            restorableConfig.isShared === isShared_default &&
            restorableConfig.friendlyName === friendlyName_default &&
            restorableConfig.helmValuesPatch.length === 0
        );
    }
);

const chartIconUrl = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.chartIconUrl;
});

const helmReleaseName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return `${state.chartName}-${state.k8sRandomSubdomain}`;
});

const catalogRepositoryUrl = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.catalogRepositoryUrl;
});

const launchCommands = createSelector(
    isReady,
    catalogId,
    chartName,
    chartVersion,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.chartVersion_default;
    }),
    catalogRepositoryUrl,
    helmReleaseName,
    helmValues,
    projectManagement.protectedSelectors.currentProject,
    (
        isReady,
        catalogId,
        chartName,
        chartVersion,
        chartVersion_default,
        catalogRepositoryUrl,
        helmReleaseName,
        helmValues,
        currentProject
    ) => {
        if (!isReady) {
            return null;
        }

        assert(catalogId !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(chartVersion_default !== null);
        assert(catalogRepositoryUrl !== null);
        assert(helmReleaseName !== null);
        assert(helmValues !== null);

        return [
            `helm repo add ${catalogId} ${catalogRepositoryUrl}`,
            ["cat << EOF > ./values.yaml", yaml.stringify(helmValues), "EOF"].join("\n"),
            [
                `helm install ${helmReleaseName} ${catalogId}/${chartName}`,
                currentProject.group === undefined
                    ? undefined
                    : `--namespace ${currentProject.namespace}`,
                chartVersion === chartVersion_default
                    ? undefined
                    : `--version ${chartVersion}`,
                `-f values.yaml`
            ]
                .filter(exclude(undefined))
                .join(" ")
        ];
    }
);

const launchScript = createSelector(
    isReady,
    launchCommands,
    helmReleaseName,
    (isReady, launchCommands, helmReleaseName) => {
        if (!isReady) {
            return null;
        }
        assert(launchCommands !== null);
        assert(helmReleaseName !== null);
        return {
            fileBasename: `launch-${helmReleaseName}.sh`,
            content: launchCommands.join("\n\n")
        };
    }
);

const commandLogsEntries = createSelector(
    isReady,
    launchCommands,
    userConfigs.selectors.userConfigs,
    (isReady, launchCommands, userConfigs) => {
        if (!isReady) {
            return null;
        }

        assert(launchCommands !== null);

        if (!userConfigs.isCommandBarEnabled) {
            return undefined;
        }

        return launchCommands.map((cmd, i) => ({
            cmdId: i,
            cmd,
            resp: ""
        }));
    }
);

export type LabeledHelmChartSourceUrls = {
    helmChartSourceUrl: string | undefined;
    helmChartRepositorySourceUrl: string | undefined;
    dockerImageSourceUrl: string | undefined;
};

const labeledHelmChartSourceUrls = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    const { helmChartSourceUrls } = state;

    const chartRepositoryName = (
        state.catalogRepositoryUrl
            .split("/")
            .filter(exclude(""))
            .filter(part => !part.startsWith("http"))
            .pop() ?? state.catalogId
    ).toLowerCase();

    const chartName = state.chartName.toLowerCase();

    const helmChartSourceUrl = (() => {
        const candidates = helmChartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url.includes(chartRepositoryName) && url.includes(chartName));

        return candidates.find(url => url.includes("helm")) ?? candidates.shift();
    })();

    const helmChartRepositorySourceUrl = (() => {
        from_helmChartUrl: {
            if (helmChartSourceUrl === undefined) {
                break from_helmChartUrl;
            }

            if (!helmChartSourceUrl.includes(chartRepositoryName)) {
                break from_helmChartUrl;
            }

            let candidate = helmChartSourceUrl.split("?")[0].replace(/\/$/, "");

            if (!candidate.includes("tree")) {
                break from_helmChartUrl;
            }

            if (!candidate.includes(chartName)) {
                break from_helmChartUrl;
            }

            candidate = candidate.split("/tree/")[0].replace(/\/-$/, "");

            return candidate;
        }

        const candidates = helmChartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url.includes(chartRepositoryName));

        return candidates.find(url => url.includes("helm")) ?? candidates.shift();
    })();

    return id<LabeledHelmChartSourceUrls>({
        helmChartSourceUrl,
        helmChartRepositorySourceUrl,
        dockerImageSourceUrl: helmChartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url !== helmChartRepositorySourceUrl)
            .find(url => url.includes("image") || url.includes("docker"))
    });
});

const availableChartVersions = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.availableChartVersions;
});

const catalogName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.catalogName;
});

const willOverwriteExistingConfigOnSave = createSelector(
    isReady,
    chartName,
    catalogId,
    friendlyName,
    restorableConfigManagement.selectors.restorableConfigs,
    (isReady, chartName, catalogId, friendlyName, restorableConfigs) => {
        if (!isReady) {
            return null;
        }

        assert(chartName !== null);
        assert(catalogId !== null);
        assert(friendlyName !== null);

        return (
            restorableConfigs.find(
                restorableConfig =>
                    restorableConfig.catalogId === catalogId &&
                    restorableConfig.chartName === chartName &&
                    restorableConfig.friendlyName === friendlyName
            ) !== undefined
        );
    }
);

const groupProjectName = createSelector(
    projectManagement.protectedSelectors.currentProject,
    currentProject =>
        currentProject.group === undefined ? undefined : currentProject.name
);

const main = createSelector(
    isReady,
    friendlyName,
    isShared,
    chartName,
    chartVersion,
    availableChartVersions,
    restorableConfig,
    rootForm,
    willOverwriteExistingConfigOnSave,
    isRestorableConfigSaved,
    isDefaultConfiguration,
    catalogName,
    chartIconUrl,
    launchScript,
    commandLogsEntries,
    groupProjectName,
    s3ConfigSelect,
    labeledHelmChartSourceUrls,
    helmValues,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.helmValuesSchema_forDataTextEditor;
    }),
    (
        isReady,
        friendlyName,
        isShared,
        chartName,
        chartVersion,
        availableChartVersions,
        restorableConfig,
        rootForm,
        willOverwriteExistingConfigOnSave,
        isRestorableConfigSaved,
        isDefaultConfiguration,
        catalogName,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        groupProjectName,
        s3ConfigSelect,
        labeledHelmChartSourceUrls,
        helmValues,
        helmValuesSchema_forDataTextEditor
    ) => {
        if (!isReady) {
            return {
                isReady: false as const
            };
        }

        assert(friendlyName !== null);
        assert(isShared !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(availableChartVersions !== null);
        assert(restorableConfig !== null);
        assert(rootForm !== null);
        assert(willOverwriteExistingConfigOnSave !== null);
        assert(isRestorableConfigSaved !== null);
        assert(isDefaultConfiguration !== null);
        assert(catalogName !== null);
        assert(chartIconUrl !== null);
        assert(launchScript !== null);
        assert(commandLogsEntries !== null);
        assert(groupProjectName !== null);
        assert(s3ConfigSelect !== null);
        assert(labeledHelmChartSourceUrls !== null);
        assert(helmValues !== null);
        assert(helmValuesSchema_forDataTextEditor !== null);

        return {
            isReady: true as const,
            friendlyName,
            isShared,
            chartName,
            chartVersion,
            availableChartVersions,
            restorableConfig,
            rootForm,
            willOverwriteExistingConfigOnSave,
            isRestorableConfigSaved,
            isDefaultConfiguration,
            catalogName,
            chartIconUrl,
            launchScript,
            commandLogsEntries,
            groupProjectName,
            s3ConfigSelect,
            labeledHelmChartSourceUrls,
            helmValues,
            helmValuesSchema_forDataTextEditor
        };
    }
);

export const selectors = { main };

export const privateSelectors = {
    helmReleaseName,
    restorableConfig,
    helmValues: createSelector(readyState, state => {
        if (state === null) {
            return null;
        }
        return state.helmValues;
    }),
    rootForm,
    paramsOfComputeRootForm_butHelmValues
};
