import type { Thunks } from "../../core";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { selectors as userConfigsSelectors } from "../userConfigs";
import { same } from "evt/tools/inDepth/same";
import { type FormFieldValue, formFieldsValueToObject } from "./FormField";
import {
    type JSONSchemaFormFieldDescription,
    type JSONSchemaObject,
    type XOnyxiaContext
} from "core/ports/OnyxiaApi";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import * as publicIpUsecase from "../publicIp";
import * as userAuthentication from "../userAuthentication";
import * as deploymentRegion from "../deploymentRegion";
import * as projectConfigs from "../projectConfigs";
import { parseUrl } from "core/tools/parseUrl";
import { typeGuard } from "tsafe/typeGuard";
import { getRandomK8sSubdomain, getServiceId } from "../../ports/OnyxiaApi";
import { getS3UrlAndRegion } from "../../adapters/s3client/getS3UrlAndRegion";
import * as secretExplorer from "../secretExplorer";
import type { FormField } from "./FormField";
import * as yaml from "yaml";
import type { Equals } from "tsafe";
import { actions, name, type State } from "./state";
import { generateRandomPassword } from "core/tools/generateRandomPassword";

export const thunks = {
    "initialize":
        (params: {
            catalogId: string;
            packageName: string;
            formFieldsValueDifferentFromDefault: FormFieldValue[];
        }) =>
        async (...args) => {
            const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
                params;

            const [
                dispatch,
                getState,
                { onyxiaApi, oidc, secretsManager, s3Client, coreParams }
            ] = args;

            assert(
                getState().launcher.stateDescription === "not initialized",
                "the reset thunk need to be called before initializing again"
            );

            dispatch(actions.initializationStarted());
            const { isDevModeEnabled } = userConfigsSelectors.userConfigs(getState());

            const { dependencies, sources, packageVersion, getValuesSchemaJson } =
                await onyxiaApi.getPackageConfig({
                    catalogId,
                    packageName,
                    isDevModeEnabled
                });

            {
                const state = getState()[name];

                assert(state.stateDescription === "not initialized");

                if (!state.isInitializing) {
                    return;
                }
            }

            assert(oidc.isUserLoggedIn);

            const valuesSchemaJson = getValuesSchemaJson({
                "xOnyxiaContext": await (async (): Promise<XOnyxiaContext> => {
                    const { publicIp } = await dispatch(publicIpUsecase.thunks.fetch());

                    const user = dispatch(userAuthentication.thunks.getUser());

                    const userConfigs = userConfigsSelectors.userConfigs(getState());

                    const region = deploymentRegion.selectors.selectedDeploymentRegion(
                        getState()
                    );

                    const servicePassword = await dispatch(
                        projectConfigs.thunks.getServicesPassword()
                    );

                    const project = projectConfigs.selectors.selectedProject(getState());

                    const doInjectPersonalInfos =
                        project.group === undefined ||
                        !coreParams.disablePersonalInfosInjectionInGroup;

                    const xOnyxiaContext: XOnyxiaContext = {
                        "user": {
                            "idep": user.username,
                            "name": `${user.familyName} ${user.firstName}`,
                            "email": user.email,
                            "password": servicePassword,
                            "ip": !doInjectPersonalInfos ? "0.0.0.0" : publicIp,
                            "darkMode": userConfigs.isDarkModeEnabled
                        },
                        "service": {
                            "oneTimePassword": generateRandomPassword()
                        },
                        "project": {
                            "id": project.id,
                            "password": servicePassword,
                            "basic": btoa(
                                unescape(
                                    encodeURIComponent(`${project.id}:${servicePassword}`)
                                )
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
                                  "token":
                                      userConfigs.githubPersonalAccessToken ?? undefined
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
                            const project = projectConfigs.selectors.selectedProject(
                                getState()
                            );

                            const { accessKeyId, secretAccessKey, sessionToken } =
                                await s3Client.getToken({
                                    "restrictToBucketName":
                                        project.group === undefined
                                            ? undefined
                                            : project.bucket
                                });

                            s3Client.createBucketIfNotExist(project.bucket);

                            return {
                                "AWS_ACCESS_KEY_ID": !doInjectPersonalInfos
                                    ? ""
                                    : accessKeyId,
                                "AWS_BUCKET_NAME": project.bucket,
                                "AWS_SECRET_ACCESS_KEY": !doInjectPersonalInfos
                                    ? ""
                                    : secretAccessKey,
                                "AWS_SESSION_TOKEN": !doInjectPersonalInfos
                                    ? ""
                                    : sessionToken,
                                ...(() => {
                                    const { s3: s3Params } =
                                        deploymentRegion.selectors.selectedDeploymentRegion(
                                            getState()
                                        );

                                    if (s3Params === undefined) {
                                        return {
                                            "AWS_DEFAULT_REGION": "",
                                            "AWS_S3_ENDPOINT": "",
                                            "port": 443
                                        };
                                    }

                                    const { region, host, port } = (() => {
                                        const { region, url } =
                                            getS3UrlAndRegion(s3Params);

                                        const { host, port = 443 } = parseUrl(url);

                                        return { region, host, port };
                                    })();

                                    return {
                                        "AWS_DEFAULT_REGION": region,
                                        "AWS_S3_ENDPOINT": host,
                                        port
                                    };
                                })()
                            };
                        })(),
                        "region": {
                            "defaultIpProtection": region.defaultIpProtection,
                            "defaultNetworkPolicy": region.defaultNetworkPolicy,
                            "allowedURIPattern":
                                region.allowedURIPatternForUserDefinedInitScript,
                            "kafka": region.kafka,
                            "from": region.from,
                            "tolerations": region.tolerations,
                            "nodeSelector": region.nodeSelector,
                            "startupProbe": region.startupProbe,
                            "sliders": region.sliders,
                            "resources": region.resources
                        },
                        "k8s": {
                            "domain": region.kubernetesClusterDomain,
                            "ingressClassName": region.ingressClassName,
                            "ingress": region.ingress,
                            "route": region.route,
                            "istio": region.istio,
                            "randomSubdomain":
                                (getRandomK8sSubdomain.clear(), getRandomK8sSubdomain()),
                            "initScriptUrl": region.initScriptUrl
                        },
                        "proxyInjection": region.proxyInjection,
                        "packageRepositoryInjection": region.packageRepositoryInjection,
                        "certificateAuthorityInjection":
                            region.certificateAuthorityInjection
                    };

                    return xOnyxiaContext;
                })()
            });

            const {
                formFields,
                infosAboutWhenFieldsShouldBeHidden,
                sensitiveConfigurations
            } = (() => {
                const formFields: State.Ready["formFields"] = [];
                const infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"] =
                    [];

                const sensitiveConfigurations: FormFieldValue[] | undefined = (() => {
                    if (
                        getState().restorablePackageConfig.restorablePackageConfigs.find(
                            restorablePackageConfig =>
                                same(restorablePackageConfig, {
                                    packageName,
                                    catalogId,
                                    formFieldsValueDifferentFromDefault
                                })
                        ) !== undefined
                    ) {
                        return undefined;
                    }

                    return [];
                })();

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
                                jsonSchemaObjectOrFormFieldDescription.type ===
                                    "object" &&
                                "properties" in jsonSchemaObjectOrFormFieldDescription
                            ) {
                                const jsonSchemaObject =
                                    jsonSchemaObjectOrFormFieldDescription;

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
                                        "description":
                                            jsonSchemaFormFieldDescription.description,
                                        "isReadonly":
                                            jsonSchemaFormFieldDescription["x-onyxia"]
                                                ?.readonly ?? false
                                    };

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        ["slider", "textArea", "password", "list"].find(
                                            render =>
                                                render ===
                                                jsonSchemaFormFieldDescription.render
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
                                        const value =
                                            jsonSchemaFormFieldDescription.default!;

                                        if (
                                            "sliderExtremity" in
                                            jsonSchemaFormFieldDescription
                                        ) {
                                            const scopCommon = {
                                                ...common,
                                                "type": "slider",
                                                "sliderVariation": "range"
                                            } as const;

                                            switch (
                                                jsonSchemaFormFieldDescription.sliderExtremity
                                            ) {
                                                case "down":
                                                    return id<FormField.Slider.Range.Down>(
                                                        {
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
                                                        }
                                                    );
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
                                            "sliderMin":
                                                jsonSchemaFormFieldDescription.sliderMin,
                                            "sliderUnit":
                                                jsonSchemaFormFieldDescription.sliderUnit,
                                            "sliderStep":
                                                jsonSchemaFormFieldDescription.sliderStep,
                                            "sliderMax":
                                                jsonSchemaFormFieldDescription.sliderMax,
                                            value
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type === "boolean"
                                    ) {
                                        return id<FormField.Boolean>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "type": "boolean"
                                        });
                                    }

                                    if (
                                        jsonSchemaFormFieldDescription.type ===
                                            "object" ||
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
                                            jsonSchemaFormFieldDescription.type ===
                                                "integer" ||
                                                jsonSchemaFormFieldDescription.type ===
                                                    "number"
                                        )
                                    ) {
                                        return id<FormField.Integer>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "minimum":
                                                jsonSchemaFormFieldDescription.minimum,
                                            "type": "integer"
                                        });
                                    }

                                    if (
                                        "render" in jsonSchemaFormFieldDescription &&
                                        jsonSchemaFormFieldDescription.render === "list"
                                    ) {
                                        return id<FormField.Enum>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "enum": jsonSchemaFormFieldDescription.listEnum,
                                            "type": "enum"
                                        });
                                    }

                                    if ("enum" in jsonSchemaFormFieldDescription) {
                                        return id<FormField.Enum>({
                                            ...common,
                                            "value":
                                                jsonSchemaFormFieldDescription.default,
                                            "enum": jsonSchemaFormFieldDescription.enum,
                                            "type": "enum"
                                        });
                                    }

                                    security_warning: {
                                        if (sensitiveConfigurations === undefined) {
                                            break security_warning;
                                        }

                                        const { pattern } =
                                            jsonSchemaFormFieldDescription[
                                                "x-security"
                                            ] ?? {};

                                        if (pattern === undefined) {
                                            break security_warning;
                                        }

                                        const value =
                                            formFieldsValueDifferentFromDefault.find(
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
                                            jsonSchemaFormFieldDescription.render ===
                                            "password"
                                                ? "password"
                                                : "text",
                                        "defaultValue":
                                            jsonSchemaFormFieldDescription.default,
                                        "doRenderAsTextArea":
                                            jsonSchemaFormFieldDescription.render ===
                                            "textArea"
                                    });
                                })()
                            );

                            infosAboutWhenFieldsShouldBeHidden.push({
                                "path": newCurrentPath,
                                "isHidden": (() => {
                                    const { hidden } = jsonSchemaFormFieldDescription;

                                    if (hidden === undefined) {
                                        const hidden =
                                            jsonSchemaFormFieldDescription["x-onyxia"]
                                                ?.hidden;

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
                    "jsonSchemaObject": valuesSchemaJson
                });

                return {
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    sensitiveConfigurations
                };
            })();

            const { catalogLocation, icon } = await (async () => {
                const catalog = await onyxiaApi.getCatalogs().then(apiRequestResult =>
                    //TODO: Sort in the adapter of even better, assumes version sorted
                    //and validate this assertion with zod
                    apiRequestResult.find(({ id }) => id === catalogId)
                );

                assert(catalog !== undefined);

                return {
                    "catalogLocation": catalog.location,

                    "icon": catalog.charts.find(({ name }) => name === packageName)!
                        .versions[0].icon
                };
            })();

            dispatch(
                actions.initialized({
                    catalogId,
                    catalogLocation,
                    icon,
                    packageName,
                    packageVersion,
                    sources,
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    "config": valuesSchemaJson,
                    dependencies,
                    formFieldsValueDifferentFromDefault,
                    "sensitiveConfigurations": sensitiveConfigurations ?? []
                })
            );
        },
    "reset":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.reset());
        },
    "restoreAllDefault":
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const state = getState().launcher;

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

            const state = getState().launcher;

            assert(state.stateDescription === "ready");

            await onyxiaApi.launchPackage({
                "catalogId": state.catalogId,
                "packageName": state.packageName,
                "packageVersion": state.packageVersion,
                "options": formFieldsValueToObject(state.formFields)
            });

            const { serviceId } = getServiceId({
                "packageName": state.packageName,
                "randomK8sSubdomain": getRandomK8sSubdomain()
            });

            dispatch(actions.launchCompleted({ serviceId }));
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
            const [dispatch] = args;

            dispatch(
                thunks.changeFormFieldValue({
                    "path": onyxiaIsSharedFormFieldPath.split("."),
                    "value": params.isShared
                })
            );
        }
} satisfies Thunks;
