import type { Thunks } from "core/bootstrap";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { type FormFieldValue, formFieldsValueToObject } from "./FormField";
import {
    type JSONSchemaFormFieldDescription,
    type JSONSchemaObject,
    type XOnyxiaContext,
    Chart
} from "core/ports/OnyxiaApi";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import * as userAuthentication from "../userAuthentication";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as userConfigsUsecase from "core/usecases/userConfigs";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import { parseUrl } from "core/tools/parseUrl";
import { typeGuard } from "tsafe/typeGuard";
import * as secretExplorer from "../secretExplorer";
import type { FormField } from "./FormField";
import * as yaml from "yaml";
import type { Equals } from "tsafe";
import { actions, name, type State } from "./state";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import * as restorableConfigManagement from "core/usecases/restorableConfigManagement";
import { privateSelectors } from "./selectors";
import { Evt } from "evt";
import type { DeepPartial } from "core/tools/DeepPartial";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { deepAssign } from "core/tools/deepAssign";
import structuredClone from "@ungap/structured-clone";

export const thunks = {
    "initialize":
        (params: {
            catalogId: string;
            chartName: string;
            chartVersion: string | undefined;
            formFieldsValueDifferentFromDefault: FormFieldValue[];
        }) =>
        (...args): { cleanup: () => void } => {
            const {
                catalogId,
                chartName,
                chartVersion: pinnedChartVersion,
                formFieldsValueDifferentFromDefault
            } = params;

            const [dispatch, getState, rootContext] = args;
            const { onyxiaApi, evtAction } = rootContext;

            assert(
                getState()[name].stateDescription === "not initialized",
                "the cleanup should have been called"
            );

            dispatch(actions.initializationStarted());

            const ctx = Evt.newCtx();

            ctx.evtDoneOrAborted.attachOnce(() => dispatch(actions.reset()));

            const cleanup = () => {
                ctx.done();
            };

            evtAction.attachOnce(
                event =>
                    event.usecaseName === "projectManagement" &&
                    event.actionName === "projectChanged",
                ctx,
                () => {
                    cleanup();
                    dispatch(thunks.initialize(params));
                }
            );

            (async () => {
                const {
                    catalogName,
                    catalogRepositoryUrl,
                    chartIconUrl,
                    defaultChartVersion,
                    chartVersion,
                    availableChartVersions
                } = await dispatch(
                    privateThunks.getChartInfos({
                        catalogId,
                        chartName,
                        pinnedChartVersion
                    })
                );

                const {
                    nonLibraryDependencies: nonLibraryChartDependencies,
                    sourceUrls: chartSourceUrls,
                    getChartValuesSchemaJson
                } = await onyxiaApi.getHelmChartDetails({
                    catalogId,
                    chartName,
                    chartVersion
                });

                const xOnyxiaContext = await dispatch(privateThunks.getXOnyxiaContext());

                if (ctx.completionStatus !== undefined) {
                    return;
                }

                const valuesSchema = getChartValuesSchemaJson({ xOnyxiaContext });

                setContext(rootContext, {
                    xOnyxiaContext,
                    getChartValuesSchemaJson
                });

                const {
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    sensitiveConfigurations
                } = getInitialFormFields({
                    formFieldsValueDifferentFromDefault,
                    valuesSchema
                });

                const isRestorableConfigSaved = dispatch(
                    restorableConfigManagement.protectedThunks.getIsRestorableConfigSaved(
                        {
                            "restorableConfig": {
                                catalogId,
                                chartName,
                                chartVersion,
                                formFieldsValueDifferentFromDefault
                            }
                        }
                    )
                );

                dispatch(
                    actions.initialized({
                        catalogId,
                        catalogName,
                        catalogRepositoryUrl,
                        chartIconUrl,
                        chartName,
                        defaultChartVersion,
                        chartVersion,
                        availableChartVersions,
                        chartSourceUrls,
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        valuesSchema,
                        nonLibraryChartDependencies,
                        formFieldsValueDifferentFromDefault,
                        "sensitiveConfigurations": isRestorableConfigSaved
                            ? sensitiveConfigurations
                            : [],
                        "k8sRandomSubdomain": xOnyxiaContext.k8s.randomSubdomain
                    })
                );

                if (pinnedChartVersion === undefined) {
                    dispatch(actions.defaultChartVersionSelected());
                }

                use_custom_s3_config: {
                    const indexOfCustomS3ConfigForXOnyxia =
                        s3ConfigManagement.protectedSelectors.indexOfCustomS3ConfigForXOnyxia(
                            getState()
                        );

                    if (indexOfCustomS3ConfigForXOnyxia === undefined) {
                        break use_custom_s3_config;
                    }

                    dispatch(
                        thunks.useCustomS3Config({
                            "customS3ConfigIndex": indexOfCustomS3ConfigForXOnyxia
                        })
                    );
                }
            })();

            return { cleanup };
        },
    "restoreAllDefault":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const { defaultFormFieldsValue } = state;

            defaultFormFieldsValue.forEach(({ path, value }) => {
                dispatch(
                    actions.formFieldValueChanged({
                        "formFieldValue": {
                            path,
                            value
                        }
                    })
                );
            });
        },
    "changeChartVersion":
        (params: { chartVersion: string }) =>
        async (...args) => {
            const { chartVersion } = params;

            const [dispatch, getState] = args;

            const rootState = getState();

            const state = rootState[name];

            if (state.stateDescription !== "ready") {
                return;
            }

            if (state.chartVersion === chartVersion) {
                return;
            }

            const formFieldsValueDifferentFromDefault =
                privateSelectors.formFieldsValueDifferentFromDefault(rootState);

            assert(formFieldsValueDifferentFromDefault !== undefined);

            dispatch(actions.reset());

            dispatch(
                thunks.initialize({
                    "catalogId": state.catalogId,
                    "chartName": state.chartName,
                    chartVersion,
                    formFieldsValueDifferentFromDefault
                })
            );
        },
    "changeFormFieldValue":
        (params: FormFieldValue) =>
        (...args) => {
            const [dispatch] = args;
            const formFieldValue = params;
            dispatch(actions.formFieldValueChanged({ formFieldValue }));
        },
    "launch":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            dispatch(actions.launchStarted());

            const rootState = getState();

            const helmReleaseName = privateSelectors.helmReleaseName(rootState);

            assert(helmReleaseName !== undefined);

            const state = rootState[name];

            assert(state.stateDescription === "ready");

            await onyxiaApi.helmInstall({
                helmReleaseName,
                "catalogId": state.catalogId,
                "chartName": state.chartName,
                "chartVersion": state.chartVersion,
                "values": formFieldsValueToObject(state.formFields)
            });

            dispatch(actions.launchCompleted());
        },
    "changeFriendlyName":
        (friendlyName: string) =>
        (...args) => {
            const [dispatch] = args;
            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaFriendlyNameFormFieldPath.split("."),
                    "value": friendlyName
                })
            );
        },
    "changeIsShared":
        (params: { isShared: boolean }) =>
        (...args) => {
            const [dispatch, getState] = args;

            assert(privateSelectors.isShared(getState()) !== undefined);

            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaIsSharedFormFieldPath.split("."),
                    "value": params.isShared
                })
            );
        },
    "useCustomS3Config":
        (params: { customS3ConfigIndex: number }) =>
        (...args) => {
            const { customS3ConfigIndex } = params;

            const [dispatch, getState] = args;

            const customS3Configs = s3ConfigManagement.protectedSelectors.customS3Configs(
                getState()
            );

            const customS3Config = customS3Configs[customS3ConfigIndex];

            assert(customS3Config !== undefined);

            const { host, port = 443 } = parseUrl(customS3Config.url);

            dispatch(
                privateThunks.updateXOnyxiaContext({
                    "partialXOnyxiaContext": {
                        "s3": {
                            "AWS_ACCESS_KEY_ID": customS3Config.accessKeyId,
                            "AWS_BUCKET_NAME": bucketNameAndObjectNameFromS3Path(
                                customS3Config.workingDirectoryPath
                            ).bucketName,
                            "AWS_SECRET_ACCESS_KEY": customS3Config.secretAccessKey,
                            "AWS_SESSION_TOKEN": customS3Config.sessionToken ?? "",
                            "AWS_DEFAULT_REGION": customS3Config.region,
                            "AWS_S3_ENDPOINT": host,
                            port,
                            "pathStyleAccess": customS3Config.pathStyleAccess
                        }
                    }
                })
            );
        }
} satisfies Thunks;

const privateThunks = {
    "getXOnyxiaContext":
        () =>
        async (...args): Promise<XOnyxiaContext> => {
            const [
                dispatch,
                getState,
                { paramsOfBootstrapCore, secretsManager, s3ClientSts, onyxiaApi }
            ] = args;

            const user = userAuthentication.selectors.user(getState());

            const userConfigs = userConfigsUsecase.selectors.userConfigs(getState());

            const region = deploymentRegionManagement.selectors.currentDeploymentRegion(
                getState()
            );

            const servicePassword = projectManagement.selectors.servicePassword(
                getState()
            );

            const project = projectManagement.selectors.currentProject(getState());

            const doInjectPersonalInfos =
                project.group === undefined ||
                !paramsOfBootstrapCore.disablePersonalInfosInjectionInGroup;

            const xOnyxiaContext: XOnyxiaContext = {
                "user": {
                    "idep": user.username,
                    "name": `${user.familyName} ${user.firstName}`,
                    "email": user.email,
                    "password": servicePassword,
                    "ip": !doInjectPersonalInfos ? "0.0.0.0" : await onyxiaApi.getIp(),
                    "darkMode": userConfigs.isDarkModeEnabled,
                    "lang": paramsOfBootstrapCore.getCurrentLang()
                },
                "service": {
                    "oneTimePassword": generateRandomPassword()
                },
                "project": {
                    "id": project.id,
                    "password": servicePassword,
                    "basic": btoa(
                        unescape(encodeURIComponent(`${project.id}:${servicePassword}`))
                    )
                },
                "git": !doInjectPersonalInfos
                    ? {
                          "name": "",
                          "email": "",
                          "credentials_cache_duration": 0,
                          "token": undefined
                      }
                    : {
                          "name": userConfigs.gitName,
                          "email": userConfigs.gitEmail,
                          "credentials_cache_duration":
                              userConfigs.gitCredentialCacheDuration,
                          "token": userConfigs.githubPersonalAccessToken ?? undefined
                      },
                "vault": await (async () => {
                    const { vault } = region;

                    if (vault === undefined) {
                        return {
                            "VAULT_ADDR": "",
                            "VAULT_TOKEN": "",
                            "VAULT_MOUNT": "",
                            "VAULT_TOP_DIR": ""
                        };
                    }

                    return {
                        "VAULT_ADDR": vault.url,
                        "VAULT_TOKEN": !doInjectPersonalInfos
                            ? ""
                            : (await secretsManager.getToken()).token,
                        "VAULT_MOUNT": vault.kvEngine,
                        "VAULT_TOP_DIR": dispatch(
                            secretExplorer.protectedThunks.getHomeDirectoryPath()
                        )
                    };
                })(),
                "kaggleApiToken": !doInjectPersonalInfos
                    ? undefined
                    : userConfigs.kaggleApiToken ?? undefined,
                "s3": await (async () => {
                    const indexOfCustomS3ConfigForXOnyxia =
                        s3ConfigManagement.protectedSelectors.indexOfCustomS3ConfigForXOnyxia(
                            getState()
                        );

                    if (
                        indexOfCustomS3ConfigForXOnyxia !== undefined ||
                        region.s3?.sts === undefined
                    ) {
                        return {
                            "AWS_ACCESS_KEY_ID": "",
                            "AWS_SECRET_ACCESS_KEY": "",
                            "AWS_SESSION_TOKEN": "",
                            "AWS_BUCKET_NAME": "",
                            "AWS_DEFAULT_REGION": "",
                            "AWS_S3_ENDPOINT": "",
                            "port": 0,
                            "pathStyleAccess": true
                        };
                    }

                    assert(s3ClientSts !== undefined);

                    const project = projectManagement.selectors.currentProject(
                        getState()
                    );

                    const { host, port = 443 } = parseUrl(region.s3.url);

                    return {
                        ...(await (async () => {
                            if (!doInjectPersonalInfos) {
                                return {
                                    "AWS_ACCESS_KEY_ID": "",
                                    "AWS_SECRET_ACCESS_KEY": "",
                                    "AWS_SESSION_TOKEN": ""
                                };
                            }

                            const tokens = await s3ClientSts
                                .getToken({
                                    "doForceRenew": false
                                })
                                .catch(error => error as Error);

                            if (tokens instanceof Error) {
                                console.warn(
                                    [
                                        "Failed to get temporary credentials for S3.",
                                        "You will not be able to use S3.",
                                        "Please contact support."
                                    ].join("\n")
                                );
                                return {
                                    "AWS_ACCESS_KEY_ID": "",
                                    "AWS_SECRET_ACCESS_KEY": "",
                                    "AWS_SESSION_TOKEN": ""
                                };
                            }

                            const { accessKeyId, secretAccessKey, sessionToken } = tokens;

                            assert(sessionToken !== undefined);

                            return {
                                "AWS_ACCESS_KEY_ID": accessKeyId,
                                "AWS_SECRET_ACCESS_KEY": secretAccessKey,
                                "AWS_SESSION_TOKEN": sessionToken
                            };
                        })()),
                        "AWS_BUCKET_NAME": (() => {
                            const { workingDirectory } = region.s3;

                            switch (workingDirectory.bucketMode) {
                                case "multi":
                                    return project.group === undefined
                                        ? `${workingDirectory.bucketNamePrefix}${user.username}`
                                        : `${workingDirectory.bucketNamePrefixGroup}${project.group}`;
                                case "shared":
                                    return workingDirectory.bucketName;
                            }
                            assert<Equals<typeof workingDirectory, never>>(true);
                        })(),
                        "AWS_DEFAULT_REGION": region.s3.region ?? "",
                        "AWS_S3_ENDPOINT": host,
                        port,
                        "pathStyleAccess": region.s3.pathStyleAccess
                    };
                })(),
                "region": {
                    "defaultIpProtection": region.defaultIpProtection,
                    "defaultNetworkPolicy": region.defaultNetworkPolicy,
                    "allowedURIPattern": region.allowedURIPatternForUserDefinedInitScript,
                    "kafka": region.kafka,
                    "from": region.from,
                    "tolerations": region.tolerations,
                    "nodeSelector": region.nodeSelector,
                    "startupProbe": region.startupProbe,
                    "sliders": region.sliders,
                    "resources": region.resources,
                    "customValues": region.customValues ?? {}
                },
                "k8s": {
                    "domain": region.kubernetesClusterDomain,
                    "ingressClassName": region.ingressClassName,
                    "ingress": region.ingress,
                    "route": region.route,
                    "istio": region.istio,
                    "randomSubdomain": `${Math.floor(Math.random() * 1000000)}`,
                    "initScriptUrl": region.initScriptUrl
                },
                "proxyInjection": region.proxyInjection,
                "packageRepositoryInjection": region.packageRepositoryInjection,
                "certificateAuthorityInjection": region.certificateAuthorityInjection
            };

            return xOnyxiaContext;
        },
    "getChartInfos":
        (params: {
            catalogId: string;
            chartName: string;
            pinnedChartVersion: string | undefined;
        }) =>
        async (...args) => {
            const [, , { onyxiaApi }] = args;

            const { catalogId, chartName, pinnedChartVersion } = params;

            const { catalogs, chartsByCatalogId } =
                await onyxiaApi.getCatalogsAndCharts();

            const catalog = catalogs.find(({ id }) => id === catalogId);

            assert(catalog !== undefined);

            const chart = chartsByCatalogId[catalogId].find(
                ({ name }) => name === chartName
            );

            assert(chart !== undefined);

            const defaultChartVersion = Chart.getDefaultVersion(chart);

            const chartVersion = (() => {
                if (pinnedChartVersion !== undefined) {
                    if (
                        chart.versions.find(
                            ({ version }) => version === pinnedChartVersion
                        ) === undefined
                    ) {
                        alert(
                            [
                                `No ${pinnedChartVersion} version found for ${chartName} in ${catalog.repositoryUrl}.`,
                                `Falling back to default version ${defaultChartVersion}`
                            ].join("\n")
                        );

                        return defaultChartVersion;
                    }

                    return pinnedChartVersion;
                }

                return defaultChartVersion;
            })();

            return {
                "catalogName": catalog.name,
                "catalogRepositoryUrl": catalog.repositoryUrl,
                "chartIconUrl": chart.versions.find(
                    ({ version }) => version === chartVersion
                )!.iconUrl,
                defaultChartVersion,
                chartVersion,
                "availableChartVersions": chart.versions.map(({ version }) => version)
            };
        },
    "updateXOnyxiaContext":
        (params: { partialXOnyxiaContext: DeepPartial<XOnyxiaContext> }) =>
        async (...args) => {
            const { partialXOnyxiaContext } = params;

            const [dispatch, , rootContext] = args;

            const { xOnyxiaContext, getChartValuesSchemaJson } = getContext(rootContext);

            const { newOnyxiaContext } = (() => {
                const newOnyxiaContext = structuredClone(xOnyxiaContext);

                deepAssign({
                    "target": newOnyxiaContext,
                    "source": partialXOnyxiaContext
                });

                return { newOnyxiaContext };
            })();

            const { formFields: formFieldsWithUpdatedOnyxiaContext } =
                getInitialFormFields({
                    "valuesSchema": getChartValuesSchemaJson({
                        "xOnyxiaContext": newOnyxiaContext
                    }),
                    "formFieldsValueDifferentFromDefault": []
                });

            formFieldsWithUpdatedOnyxiaContext.forEach(({ path, value }) =>
                dispatch(
                    thunks.changeFormFieldValue({
                        path,
                        value
                    })
                )
            );
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<{
    xOnyxiaContext: XOnyxiaContext;
    getChartValuesSchemaJson: (params: {
        xOnyxiaContext: XOnyxiaContext;
    }) => JSONSchemaObject;
}>();

function getInitialFormFields(params: {
    formFieldsValueDifferentFromDefault: FormFieldValue[];
    valuesSchema: JSONSchemaObject;
}): {
    formFields: FormField[];
    infosAboutWhenFieldsShouldBeHidden: {
        path: string[];
        isHidden: boolean | FormFieldValue;
    }[];
    sensitiveConfigurations: FormFieldValue[];
} {
    const { formFieldsValueDifferentFromDefault, valuesSchema } = params;

    const formFields: State.Ready["formFields"] = [];
    const infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"] =
        [];

    const sensitiveConfigurations: FormFieldValue[] = [];

    (function callee(params: {
        jsonSchemaObject: JSONSchemaObject;
        currentPath: string[];
    }): void {
        const {
            jsonSchemaObject: { properties },
            currentPath
        } = params;

        Object.entries(properties).forEach(
            ([key, jsonSchemaObjectOrFormFieldDescription]) => {
                const newCurrentPath = [...currentPath, key];
                if (
                    jsonSchemaObjectOrFormFieldDescription.type === "object" &&
                    "properties" in jsonSchemaObjectOrFormFieldDescription
                ) {
                    const jsonSchemaObject = jsonSchemaObjectOrFormFieldDescription;

                    callee({
                        "currentPath": newCurrentPath,
                        jsonSchemaObject
                    });
                    return;
                }

                const jsonSchemaFormFieldDescription =
                    jsonSchemaObjectOrFormFieldDescription;

                formFields.push(
                    (() => {
                        const common = {
                            "path": newCurrentPath,
                            "title":
                                jsonSchemaFormFieldDescription.title ??
                                newCurrentPath.slice(-1)[0],
                            "description": jsonSchemaFormFieldDescription.description,
                            "isReadonly":
                                jsonSchemaFormFieldDescription["x-onyxia"]?.readonly ??
                                false
                        };

                        if (
                            "render" in jsonSchemaFormFieldDescription &&
                            ["slider", "textArea", "password", "list"].find(
                                render => render === jsonSchemaFormFieldDescription.render
                            ) === undefined
                        ) {
                            console.warn(
                                `${common.path.join("/")} has render: "${
                                    jsonSchemaFormFieldDescription.render
                                }" and it's not supported`
                            );
                        }

                        if (
                            "render" in jsonSchemaFormFieldDescription &&
                            jsonSchemaFormFieldDescription.render === "slider"
                        ) {
                            const value = jsonSchemaFormFieldDescription.default!;

                            if ("sliderExtremity" in jsonSchemaFormFieldDescription) {
                                const scopCommon = {
                                    ...common,
                                    "type": "slider",
                                    "sliderVariation": "range"
                                } as const;

                                switch (jsonSchemaFormFieldDescription.sliderExtremity) {
                                    case "down":
                                        return id<FormField.Slider.Range.Down>({
                                            ...scopCommon,
                                            "sliderExtremitySemantic":
                                                jsonSchemaFormFieldDescription.sliderExtremitySemantic,
                                            "sliderRangeId":
                                                jsonSchemaFormFieldDescription.sliderRangeId,
                                            "sliderExtremity": "down",
                                            "sliderMin":
                                                jsonSchemaFormFieldDescription.sliderMin,
                                            "sliderUnit":
                                                jsonSchemaFormFieldDescription.sliderUnit,
                                            "sliderStep":
                                                jsonSchemaFormFieldDescription.sliderStep,
                                            value
                                        });
                                    case "up":
                                        return id<FormField.Slider.Range.Up>({
                                            ...scopCommon,
                                            "sliderExtremitySemantic":
                                                jsonSchemaFormFieldDescription.sliderExtremitySemantic,
                                            "sliderRangeId":
                                                jsonSchemaFormFieldDescription.sliderRangeId,
                                            "sliderExtremity": "up",
                                            "sliderMax":
                                                jsonSchemaFormFieldDescription.sliderMax,
                                            value
                                        });
                                }
                            }

                            return id<FormField.Slider.Simple>({
                                ...common,
                                "type": "slider",
                                "sliderVariation": "simple",
                                "sliderMin": jsonSchemaFormFieldDescription.sliderMin,
                                "sliderUnit": jsonSchemaFormFieldDescription.sliderUnit,
                                "sliderStep": jsonSchemaFormFieldDescription.sliderStep,
                                "sliderMax": jsonSchemaFormFieldDescription.sliderMax,
                                value
                            });
                        }

                        if (jsonSchemaFormFieldDescription.type === "boolean") {
                            return id<FormField.Boolean>({
                                ...common,
                                "value": jsonSchemaFormFieldDescription.default,
                                "type": "boolean"
                            });
                        }

                        if (
                            jsonSchemaFormFieldDescription.type === "object" ||
                            jsonSchemaFormFieldDescription.type === "array"
                        ) {
                            const value = {
                                "type": "yaml" as const,
                                "yamlStr": yaml.stringify(
                                    jsonSchemaFormFieldDescription.default
                                )
                            };

                            switch (jsonSchemaFormFieldDescription.type) {
                                case "array":
                                    return id<FormField.Array>({
                                        ...common,
                                        value,
                                        "defaultValue": value,
                                        "type": jsonSchemaFormFieldDescription.type
                                    });
                                case "object":
                                    return id<FormField.Object>({
                                        ...common,
                                        value,
                                        "defaultValue": value,
                                        "type": jsonSchemaFormFieldDescription.type
                                    });
                            }

                            assert<
                                Equals<
                                    (typeof jsonSchemaFormFieldDescription)["type"],
                                    never
                                >
                            >();
                        }

                        if (
                            typeGuard<JSONSchemaFormFieldDescription.Integer>(
                                jsonSchemaFormFieldDescription,
                                jsonSchemaFormFieldDescription.type === "integer" ||
                                    jsonSchemaFormFieldDescription.type === "number"
                            )
                        ) {
                            return id<FormField.Integer>({
                                ...common,
                                "value": jsonSchemaFormFieldDescription.default,
                                "minimum": jsonSchemaFormFieldDescription.minimum,
                                "type": "integer"
                            });
                        }

                        if (
                            "render" in jsonSchemaFormFieldDescription &&
                            jsonSchemaFormFieldDescription.render === "list"
                        ) {
                            return id<FormField.Enum>({
                                ...common,
                                "value": jsonSchemaFormFieldDescription.default,
                                "enum": jsonSchemaFormFieldDescription.listEnum,
                                "type": "enum"
                            });
                        }

                        if ("enum" in jsonSchemaFormFieldDescription) {
                            return id<FormField.Enum>({
                                ...common,
                                "value": jsonSchemaFormFieldDescription.default,
                                "enum": jsonSchemaFormFieldDescription.enum,
                                "type": "enum"
                            });
                        }

                        security_warning: {
                            const { pattern } =
                                jsonSchemaFormFieldDescription["x-security"] ?? {};

                            if (pattern === undefined) {
                                break security_warning;
                            }

                            const value = formFieldsValueDifferentFromDefault.find(
                                ({ path }) => same(path, common.path)
                            )?.value;

                            if (value === undefined) {
                                break security_warning;
                            }

                            if (new RegExp(pattern).test(`${value}`)) {
                                break security_warning;
                            }

                            sensitiveConfigurations.push({
                                "path": common.path,
                                value
                            });
                        }

                        return id<FormField.Text>({
                            ...common,
                            "pattern": jsonSchemaFormFieldDescription.pattern,
                            "value": jsonSchemaFormFieldDescription.default,
                            "type":
                                jsonSchemaFormFieldDescription.render === "password"
                                    ? "password"
                                    : "text",
                            "defaultValue": jsonSchemaFormFieldDescription.default,
                            "doRenderAsTextArea":
                                jsonSchemaFormFieldDescription.render === "textArea"
                        });
                    })()
                );

                infosAboutWhenFieldsShouldBeHidden.push({
                    "path": newCurrentPath,
                    "isHidden": (() => {
                        const { hidden } = jsonSchemaFormFieldDescription;

                        if (hidden === undefined) {
                            const hidden =
                                jsonSchemaFormFieldDescription["x-onyxia"]?.hidden;

                            if (hidden !== undefined) {
                                return hidden;
                            }

                            return false;
                        }

                        if (typeof hidden === "boolean") {
                            return hidden;
                        }

                        return {
                            "path": hidden.path.split("/"),
                            "value": hidden.value
                        };
                    })()
                });
            }
        );
    })({
        "currentPath": [],
        "jsonSchemaObject": valuesSchema
    });

    return {
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
        sensitiveConfigurations
    };
}
