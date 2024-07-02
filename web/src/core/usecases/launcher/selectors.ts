import type { State as RootState } from "core/bootstrap";
import { assert, type Equals } from "tsafe/assert";
import * as yaml from "yaml";
import { name } from "./state";
import * as restorableConfigManagement from "core/usecases/restorableConfigManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { exclude } from "tsafe/exclude";
import { createSelector } from "clean-architecture";
import type { FormFieldGroup } from "./formTypes";
import {
    type Stringifyable,
    type StringifyableAtomic,
    readValueAtPath,
    getIsAtomic
} from "core/tools/Stringifyable";

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

const helmValuesSchema = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.helmValuesSchema;
});

const helmValues = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.helmValues;
});

const formFieldGroup = createSelector(
    isReady,
    helmValuesSchema,
    helmValues,
    (isReady, helmValuesSchema, helmValues) => {
        if (!isReady) {
            return null;
        }

        assert(helmValuesSchema !== null);
        assert(helmValues !== null);

        // TODO
        return null as any as FormFieldGroup;
    }
);

const isLaunchable = createSelector(isReady, formFieldGroup, (isReady, formTree) => {
    if (!isReady) {
        return null;
    }

    assert(formTree !== null);

    return (function getIsValidFormTree(formTree): boolean {
        return formTree.children.every(child => {
            switch (child.type) {
                case "field":
                    return (() => {
                        switch (child.fieldType) {
                            case "integer field":
                            case "select":
                            case "checkbox":
                            case "slider":
                            case "range slider":
                                return true;
                            case "yaml code block":
                                return child.isValid;
                            case "text field":
                                return child.doesMatchPattern;
                        }
                        assert<Equals<typeof child, never>>(true);
                    })();
                case "group":
                    return getIsValidFormTree(child);
            }
        });
    })(formTree);
});

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

const groupProjectName = createSelector(
    projectManagement.selectors.currentProject,
    currentProject =>
        currentProject.group === undefined ? undefined : currentProject.name
);

const isShared = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.isShared;
});

const defaultHelmValues = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.helmValues;
});

const restorableConfig = createSelector(
    isReady,
    friendlyName,
    isShared,
    catalogId,
    chartName,
    chartVersion,
    helmValues,
    defaultHelmValues,
    (
        isReady,
        friendlyName,
        isShared,
        catalogId,
        chartName,
        chartVersion,
        helmValues,
        defaultHelmValues
    ): projectManagement.ProjectConfigs.RestorableServiceConfig | null => {
        if (!isReady) {
            return null;
        }

        assert(catalogId !== null);
        assert(friendlyName !== null);
        assert(isShared !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(helmValues !== null);
        assert(defaultHelmValues !== null);

        const helmValuesPatch: {
            path: (string | number)[];
            value: StringifyableAtomic;
        }[] = [];

        (function crawl(value: Stringifyable, path: (string | number)[]) {
            if (getIsAtomic(value)) {
                if (readValueAtPath(defaultHelmValues, path) !== value) {
                    helmValuesPatch.push({
                        path,
                        "value": value
                    });
                }
                return;
            }

            if (value instanceof Array) {
                value.forEach((e, i) => crawl(e, [...path, i]));
                return;
            }

            Object.entries(value).forEach(([key, value]) => crawl(value, [...path, key]));
        })(helmValues, []);

        return {
            friendlyName,
            catalogId,
            isShared,
            chartName,
            chartVersion,
            helmValuesPatch
        };
    }
);

const isRestorableConfigSaved = createSelector(
    isReady,
    restorableConfig,
    restorableConfigManagement.protectedSelectors.restorableConfigs,
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

const defaultChartVersion = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.defaultChartVersion;
});

const isDefaultConfiguration = createSelector(
    isReady,
    defaultChartVersion,
    restorableConfig,
    (isReady, defaultChartVersion, restorableConfig) => {
        if (!isReady) {
            return null;
        }
        assert(defaultChartVersion !== null);
        assert(restorableConfig !== null);

        return (
            restorableConfig.chartVersion === defaultChartVersion &&
            restorableConfig.isShared !== true &&
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
    defaultChartVersion,
    catalogRepositoryUrl,
    helmReleaseName,
    helmValues,
    projectManagement.selectors.currentProject,
    (
        isReady,
        catalogId,
        chartName,
        chartVersion,
        defaultChartVersion,
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
        assert(defaultChartVersion !== null);
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
                chartVersion === defaultChartVersion
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
            "fileBasename": `launch-${helmReleaseName}.sh`,
            "content": launchCommands.join("\n\n")
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
            "cmdId": i,
            cmd,
            "resp": ""
        }));
    }
);

export type SourceUrls = {
    helmChartSourceUrl: string | undefined;
    helmChartRepositorySourceUrl: string | undefined;
    dockerImageSourceUrl: string | undefined;
};

const sourceUrls = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    const { chartSourceUrls } = state;

    const chartRepositoryName = (
        state.catalogRepositoryUrl
            .split("/")
            .filter(exclude(""))
            .filter(part => !part.startsWith("http"))
            .pop() ?? state.catalogId
    ).toLowerCase();

    const chartName = state.chartName.toLowerCase();

    const helmChartSourceUrl = (() => {
        const candidates = chartSourceUrls
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

        const candidates = chartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url.includes(chartRepositoryName));

        return candidates.find(url => url.includes("helm")) ?? candidates.shift();
    })();

    const sourceUrls: SourceUrls = {
        helmChartSourceUrl,
        helmChartRepositorySourceUrl,
        "dockerImageSourceUrl": chartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url !== helmChartRepositorySourceUrl)
            .find(url => url.includes("image") || url.includes("docker"))
    };

    return sourceUrls;
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
    restorableConfigManagement.protectedSelectors.restorableConfigs,
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

const s3ConfigurationOptions = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.s3ConfigurationOptions;
});

const s3ConfigSelect = createSelector(
    isReady,
    s3ConfigurationOptions,
    helmValues,
    (isReady, s3ConfigurationOptions, helmValues) => {
        if (!isReady) {
            return null;
        }

        assert(s3ConfigurationOptions !== null);
        assert(helmValues !== null);

        // We don't display the s3 config selector if there is no config or only one
        if (s3ConfigurationOptions.length <= 1) {
            return undefined;
        }

        // If the chart at hand does not use s3, we don't display the s3 config selector
        if (s3ConfigurationOptions[0].helmValuesPatch.length === 0) {
            return undefined;
        }

        return {
            "options": s3ConfigurationOptions.map(option => ({
                "optionValue": option.optionValue,
                "dataSource": option.dataSource,
                "accountFriendlyName": option.accountFriendlyName
            })),
            "selectedOptionValue": s3ConfigurationOptions.find(option => {
                for (const { helmValuesPath, value } of option.helmValuesPatch) {
                    if (readValueAtPath(helmValues, helmValuesPath) !== value) {
                        return false;
                    }
                }
                return true;
            })?.optionValue
        };
    }
);

const main = createSelector(
    isReady,
    friendlyName,
    isShared,
    chartName,
    chartVersion,
    availableChartVersions,
    restorableConfig,
    formFieldGroup,
    willOverwriteExistingConfigOnSave,
    isLaunchable,
    isRestorableConfigSaved,
    isDefaultConfiguration,
    catalogName,
    chartIconUrl,
    launchScript,
    commandLogsEntries,
    groupProjectName,
    s3ConfigSelect,
    sourceUrls,
    (
        isReady,
        friendlyName,
        isShared,
        chartName,
        chartVersion,
        availableChartVersions,
        restorableConfig,
        formFieldGroup,
        willOverwriteExistingConfigOnSave,
        isLaunchable,
        isRestorableConfigSaved,
        isDefaultConfiguration,
        catalogName,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        groupProjectName,
        s3ConfigSelect,
        sourceUrls
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(friendlyName !== null);
        assert(isShared !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(availableChartVersions !== null);
        assert(restorableConfig !== null);
        assert(formFieldGroup !== null);
        assert(willOverwriteExistingConfigOnSave !== null);
        assert(isLaunchable !== null);
        assert(isRestorableConfigSaved !== null);
        assert(isDefaultConfiguration !== null);
        assert(catalogName !== null);
        assert(chartIconUrl !== null);
        assert(launchScript !== null);
        assert(commandLogsEntries !== null);
        assert(groupProjectName !== null);
        assert(s3ConfigSelect !== null);
        assert(sourceUrls !== null);

        return {
            "isReady": true as const,
            friendlyName,
            isShared,
            chartName,
            chartVersion,
            availableChartVersions,
            restorableConfig,
            formFieldGroup,
            willOverwriteExistingConfigOnSave,
            isLaunchable,
            isRestorableConfigSaved,
            isDefaultConfiguration,
            catalogName,
            chartIconUrl,
            launchScript,
            commandLogsEntries,
            groupProjectName,
            s3ConfigSelect,
            sourceUrls
        };
    }
);

export const selectors = { main };

export const privateSelectors = {
    helmReleaseName,
    restorableConfig
};
