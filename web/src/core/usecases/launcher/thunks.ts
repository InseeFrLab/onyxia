import type { Thunks } from "core/bootstrap";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import type { FormFieldValue } from "./FormField";
import {
    type JSONSchemaFormFieldDescription,
    type JSONSchemaObject,
    type XOnyxiaContext,
    Chart
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
import { actions, type State } from "./state";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { privateSelectors } from "./selectors";
import { Evt } from "evt";
import { createUsecaseContextApi } from "clean-architecture";

export const thunks = {
    "initialize":
        (params: {
            catalogId: string;
            chartName: string;
            chartVersion: string | undefined;
            friendlyName: string | undefined;
            isShared?: boolean | undefined;
            formFieldsValueDifferentFromDefault: FormFieldValue[];
            autoLaunch: boolean;
        }) =>
        (...args): { cleanup: () => void } => {
            const [dispatch, getState, rootContext] = args;
            const { onyxiaApi, evtAction } = rootContext;

            let evtCleanupInitialize: Evt<void>;

            if (getIsContextSet(rootContext)) {
                evtCleanupInitialize = getContext(rootContext).evtCleanupInitialize;
                evtCleanupInitialize.post();
            } else {
                evtCleanupInitialize = Evt.create();
            }

            const {
                catalogId,
                chartName,
                chartVersion: chatVersion_params,
                formFieldsValueDifferentFromDefault,
                autoLaunch
            } = params;

            const friendlyName = params.friendlyName ?? chartName;
            const isShared =
                params.isShared ??
                projectManagement.selectors.currentProject(getState()).group === undefined
                    ? undefined
                    : false;

            dispatch(actions.initializationStarted());

            const ctx = Evt.newCtx();

            evtCleanupInitialize.attachOnce(() => ctx.done());

            ctx.evtDoneOrAborted.attachOnce(() =>
                dispatch(actions.resetToNotInitialized())
            );

            evtAction.attachOnce(
                event =>
                    event.usecaseName === "projectManagement" &&
                    event.actionName === "projectChanged",
                ctx,
                () => {
                    evtCleanupInitialize.post();
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
                        chartVersion: chatVersion_params
                    })
                );

                if (ctx.completionStatus !== undefined) {
                    return;
                }

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
                    getChartValuesSchemaJson,
                    evtCleanupInitialize
                });

                const { pathOfFormFieldsAffectedByS3ConfigChange } = (() => {
                    const { formFields: formFields_ref } = getInitialFormFields({
                        "valuesSchema": getChartValuesSchemaJson({
                            xOnyxiaContext
                        })
                    });

                    const { formFields: formFields_diff } = getInitialFormFields({
                        "valuesSchema": getChartValuesSchemaJson({
                            "xOnyxiaContext": {
                                ...xOnyxiaContext,
                                "s3": {
                                    "AWS_ACCESS_KEY_ID":
                                        xOnyxiaContext.s3.AWS_ACCESS_KEY_ID + "x",
                                    "AWS_BUCKET_NAME":
                                        xOnyxiaContext.s3.AWS_BUCKET_NAME + "x",
                                    "AWS_SECRET_ACCESS_KEY":
                                        xOnyxiaContext.s3.AWS_SECRET_ACCESS_KEY + "x",
                                    "AWS_SESSION_TOKEN":
                                        xOnyxiaContext.s3.AWS_SESSION_TOKEN + "x",
                                    "AWS_DEFAULT_REGION":
                                        xOnyxiaContext.s3.AWS_DEFAULT_REGION + "x",
                                    "AWS_S3_ENDPOINT":
                                        xOnyxiaContext.s3.AWS_S3_ENDPOINT + "x",
                                    "port": xOnyxiaContext.s3.port + 1,
                                    "pathStyleAccess": !xOnyxiaContext.s3.pathStyleAccess,
                                    "objectNamePrefix":
                                        xOnyxiaContext.s3.objectNamePrefix + "x/",
                                    "workingDirectoryPath":
                                        xOnyxiaContext.s3.workingDirectoryPath + "x/",
                                    "isAnonymous": !xOnyxiaContext.s3.isAnonymous
                                }
                            }
                        })
                    });

                    const pathOfFormFieldsAffectedByS3ConfigChange = formFields_ref
                        .filter(({ path, value }) => {
                            const formField_diff = formFields_diff.find(
                                ({ path: pathDiff }) => same(path, pathDiff)
                            );

                            assert(formField_diff !== undefined);

                            return !same(value, formField_diff.value);
                        })
                        .map(({ path }) => ({ path }));

                    return { pathOfFormFieldsAffectedByS3ConfigChange };
                })();

                const { formFields, infosAboutWhenFieldsShouldBeHidden } =
                    getInitialFormFields({ valuesSchema });

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
                        pathOfFormFieldsAffectedByS3ConfigChange,
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        valuesSchema,
                        nonLibraryChartDependencies,
                        formFieldsValueDifferentFromDefault,
                        "k8sRandomSubdomain": xOnyxiaContext.k8s.randomSubdomain,
                        friendlyName,
                        isShared
                    })
                );

                use_custom_s3_config: {
                    const has3sConfigBeenManuallyChanged =
                        privateSelectors.has3sConfigBeenManuallyChanged(getState());

                    assert(has3sConfigBeenManuallyChanged !== null);

                    if (has3sConfigBeenManuallyChanged) {
                        break use_custom_s3_config;
                    }

                    const { indexForXOnyxia } =
                        s3ConfigManagement.protectedSelectors.projectS3Config(getState());

                    if (indexForXOnyxia === undefined) {
                        break use_custom_s3_config;
                    }

                    dispatch(
                        thunks.useSpecificS3Config({
                            "type": "custom",
                            "customS3ConfigIndex": indexForXOnyxia
                        })
                    );
                }

                if (autoLaunch) {
                    dispatch(thunks.launch());
                }
            })();

            return {
                "cleanup": () => {
                    evtCleanupInitialize.post();
                }
            };
        },
    "restoreAllDefault":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            dispatch(actions.allDefaultRestored());

            const { indexForXOnyxia } =
                s3ConfigManagement.protectedSelectors.projectS3Config(getState());

            dispatch(
                thunks.useSpecificS3Config(
                    indexForXOnyxia === undefined
                        ? { "type": "default" }
                        : { "type": "custom", "customS3ConfigIndex": indexForXOnyxia }
                )
            );
        },
    "changeChartVersion":
        (params: { chartVersion: string }) =>
        async (...args) => {
            const { chartVersion } = params;

            const [dispatch, getState] = args;

            const initializeThunkParams =
                privateSelectors.initializeThunkParams(getState());

            assert(initializeThunkParams !== null);

            if (initializeThunkParams.chartVersion === chartVersion) {
                // NOTE: No changes, skip.
                return;
            }

            dispatch(
                thunks.initialize({
                    ...initializeThunkParams,
                    chartVersion,
                    "autoLaunch": false
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

            const helmInstallParams = privateSelectors.helmInstallParams(getState());

            assert(helmInstallParams !== null);

            await onyxiaApi.helmInstall(helmInstallParams);

            dispatch(actions.launchCompleted());
        },
    "changeFriendlyName":
        (friendlyName: string) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.friendlyNameChanged({ friendlyName }));
        },
    "changeIsShared":
        (params: { isShared: boolean }) =>
        (...args) => {
            const { isShared } = params;

            const [dispatch] = args;

            dispatch(actions.isSharedChanged({ isShared }));
        },
    "useSpecificS3Config":
        (
            params:
                | {
                      type: "default";
                      customS3ConfigIndex?: never;
                  }
                | {
                      type: "custom";
                      customS3ConfigIndex: number;
                  }
        ) =>
        (...args) => {
            const { type, customS3ConfigIndex } = params;

            const [dispatch, getState, rootContext] = args;

            if (type === "default") {
                dispatch(
                    actions.s3ConfigChanged({
                        "customS3ConfigIndex": undefined
                    })
                );

                return;
            }

            assert(type === "custom");

            const { getChartValuesSchemaJson, xOnyxiaContext } = getContext(rootContext);

            const xOnyxiaContextWithCustomS3Config: XOnyxiaContext = {
                ...xOnyxiaContext,
                "s3": (() => {
                    const customS3Config =
                        s3ConfigManagement.protectedSelectors.projectS3Config(getState())
                            .customConfigs[customS3ConfigIndex];

                    assert(customS3Config !== undefined);

                    const { host, port = 443 } = parseUrl(customS3Config.url);

                    const { bucketName, objectName: objectNamePrefix } =
                        bucketNameAndObjectNameFromS3Path(
                            customS3Config.workingDirectoryPath
                        );

                    return {
                        "AWS_BUCKET_NAME": bucketName,
                        "AWS_ACCESS_KEY_ID":
                            customS3Config.credentials?.accessKeyId ?? "",
                        "AWS_SECRET_ACCESS_KEY":
                            customS3Config.credentials?.secretAccessKey ?? "",
                        "AWS_SESSION_TOKEN":
                            customS3Config.credentials?.sessionToken ?? "",
                        "AWS_DEFAULT_REGION": customS3Config.region,
                        "AWS_S3_ENDPOINT": host,
                        port,
                        "pathStyleAccess": customS3Config.pathStyleAccess,
                        objectNamePrefix,
                        "workingDirectoryPath": customS3Config.workingDirectoryPath,
                        "isAnonymous": customS3Config.credentials === undefined
                    };
                })()
            };

            const { formFields } = getInitialFormFields({
                "valuesSchema": getChartValuesSchemaJson({
                    "xOnyxiaContext": xOnyxiaContextWithCustomS3Config
                })
            });

            dispatch(
                actions.s3ConfigChanged({
                    customS3ConfigIndex,
                    "formFieldsValue": formFields
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

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            const servicePassword =
                projectManagement.selectors.servicePassword(getState());

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
                    "lang": paramsOfBootstrapCore.getCurrentLang(),
                    "decodedIdToken": dispatch(
                        userAuthentication.protectedThunks.getDecodedIdToken()
                    )
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
                "s3": await (async () => {
                    const baseS3Config =
                        s3ConfigManagement.protectedSelectors.baseS3Config(getState());

                    const { host = "", port = 443 } =
                        baseS3Config.url !== "" ? parseUrl(baseS3Config.url) : {};

                    const { bucketName, objectName: objectNamePrefix } =
                        bucketNameAndObjectNameFromS3Path(
                            baseS3Config.workingDirectoryPath
                        );

                    const s3 = {
                        "AWS_ACCESS_KEY_ID": "",
                        "AWS_SECRET_ACCESS_KEY": "",
                        "AWS_SESSION_TOKEN": "",
                        "AWS_BUCKET_NAME": bucketName,
                        "AWS_DEFAULT_REGION": baseS3Config.region,
                        "AWS_S3_ENDPOINT": host,
                        port,
                        "pathStyleAccess": baseS3Config.pathStyleAccess,
                        objectNamePrefix,
                        "workingDirectoryPath": baseS3Config.workingDirectoryPath,
                        "isAnonymous": false
                    };

                    inject_tokens: {
                        if (!doInjectPersonalInfos) {
                            break inject_tokens;
                        }

                        if (s3ClientSts === undefined) {
                            break inject_tokens;
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
                            break inject_tokens;
                        }

                        assert(tokens !== undefined);

                        const { accessKeyId, secretAccessKey, sessionToken } = tokens;

                        assert(sessionToken !== undefined);

                        s3.AWS_ACCESS_KEY_ID = accessKeyId;
                        s3.AWS_SECRET_ACCESS_KEY = secretAccessKey;
                        s3.AWS_SESSION_TOKEN = sessionToken;
                    }

                    return s3;
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
                    "customValues": region.customValues ?? {},
                    "openshiftSCC": region.openshiftSCC
                },
                "k8s": {
                    "domain": region.kubernetesClusterDomain,
                    "ingressClassName": region.ingressClassName,
                    "ingress": region.ingress,
                    "route": region.route,
                    "istio": region.istio,
                    "randomSubdomain": `${Math.floor(Math.random() * 1000000)}`,
                    "initScriptUrl": region.initScriptUrl,
                    "useCertManager": region.certManager?.useCertManager,
                    "certManagerClusterIssuer":
                        region.certManager?.certManagerClusterIssuer
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
            chartVersion: string | undefined;
        }) =>
        async (...args) => {
            const [, , { onyxiaApi }] = args;

            const { catalogId, chartName, chartVersion: chartVersion_params } = params;

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
                if (chartVersion_params !== undefined) {
                    if (
                        chart.versions.find(
                            ({ version }) => version === chartVersion_params
                        ) === undefined
                    ) {
                        console.log(
                            [
                                `No ${chartVersion_params} version found for ${chartName} in ${catalog.repositoryUrl}.`,
                                `Falling back to default version ${defaultChartVersion}`
                            ].join("\n")
                        );

                        return defaultChartVersion;
                    }

                    return chartVersion_params;
                }

                return defaultChartVersion;
            })();

            return {
                "catalogName": catalog.name,
                "catalogRepositoryUrl": catalog.repositoryUrl,
                "chartIconUrl": (() => {
                    const entry = chart.versions.find(
                        ({ version }) => version === chartVersion
                    );

                    assert(entry !== undefined);

                    return entry.iconUrl;
                })(),
                defaultChartVersion,
                chartVersion,
                "availableChartVersions": chart.versions.map(({ version }) => version)
            };
        }
} satisfies Thunks;

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<{
    xOnyxiaContext: XOnyxiaContext;
    getChartValuesSchemaJson: (params: {
        xOnyxiaContext: XOnyxiaContext;
    }) => JSONSchemaObject;
    evtCleanupInitialize: Evt<void>;
}>();

function getInitialFormFields(params: { valuesSchema: JSONSchemaObject }): {
    formFields: FormField[];
    infosAboutWhenFieldsShouldBeHidden: {
        path: string[];
        isHidden: boolean | FormFieldValue;
    }[];
} {
    const { valuesSchema } = params;

    const formFields: State.Ready["formFields"] = [];
    const infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"] =
        [];

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
        infosAboutWhenFieldsShouldBeHidden
    };
}
