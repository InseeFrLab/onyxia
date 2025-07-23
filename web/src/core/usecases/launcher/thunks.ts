import type { Thunks } from "core/bootstrap";
import { assert, type Equals, is } from "tsafe/assert";
import * as userAuthentication from "../userAuthentication";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as userConfigsUsecase from "core/usecases/userConfigs";
import * as userProfileForm from "core/usecases/userProfileForm";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import { parseUrl } from "core/tools/parseUrl";
import * as secretExplorer from "../secretExplorer";
import { actions } from "./state";
import { generateRandomPassword } from "core/tools/generateRandomPassword";
import { privateSelectors } from "./selectors";
import { Evt } from "evt";
import type { StringifyableAtomic, Stringifyable } from "core/tools/Stringifyable";
import type { XOnyxiaContext, JSONSchema } from "core/ports/OnyxiaApi";
import { createUsecaseContextApi } from "clean-architecture";
import { computeHelmValues, type FormFieldValue } from "./decoupledLogic";
import { computeRootForm } from "./decoupledLogic";
import type { DeepPartial } from "core/tools/DeepPartial";

type RestorableServiceConfig = projectManagement.ProjectConfigs.RestorableServiceConfig;

type RestorableServiceConfigLike = {
    catalogId: string;
    chartName: string;
    chartVersion: string | undefined;
    friendlyName: string | undefined;
    isShared: boolean | undefined;
    s3ConfigId: string | undefined;
    helmValuesPatch:
        | {
              path: (string | number)[];
              value: StringifyableAtomic | undefined;
          }[]
        | undefined;
};

{
    type Got = RestorableServiceConfigLike;
    type Expected = {
        [Key in keyof RestorableServiceConfig]: Key extends "chartName"
            ? RestorableServiceConfig[Key]
            : Key extends "catalogId"
              ? RestorableServiceConfig[Key]
              : RestorableServiceConfig[Key] | undefined;
    };

    assert<Equals<Got, Expected>>();
}

export const thunks = {
    initialize:
        (params: {
            restorableConfig: RestorableServiceConfigLike;
            autoLaunch: boolean;
        }) =>
        (...args): { cleanup: () => void } => {
            const [dispatch, getState, rootContext] = args;
            const { onyxiaApi, evtAction } = rootContext;

            // NOTE: To check after every async operation, if true, stop everything.
            let getIsCanceled: () => boolean;
            // NOTE: This is for enabling the UI to cancel initialization.
            let cleanup: () => void;

            // NOTE: All this plumbing is to make the initialization process cancellable
            // and to make sure that if initialize is called multiple times each new call
            // cancels the previous ones.
            {
                let evtCleanupInitialize: Evt<void>;

                if (getIsContextSet(rootContext)) {
                    evtCleanupInitialize = getContext(rootContext).evtCleanupInitialize;
                    evtCleanupInitialize.post();
                } else {
                    evtCleanupInitialize = Evt.create();
                    setContext(rootContext, {
                        evtCleanupInitialize,
                        reComputeHelmValues: () => {
                            assert(false, "premature call");
                        }
                    });
                }

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
                        dispatch(
                            thunks.initialize({
                                ...params,
                                autoLaunch: false
                            })
                        );
                    }
                );

                cleanup = () => {
                    evtCleanupInitialize.post();
                };

                getIsCanceled = () => ctx.completionStatus !== undefined;
            }

            (async () => {
                const {
                    restorableConfig: {
                        catalogId,
                        chartName,
                        chartVersion: chartVersion_pinned,
                        friendlyName,
                        isShared,
                        s3ConfigId: s3ConfigId_pinned,
                        helmValuesPatch
                    },
                    autoLaunch
                } = params;

                const {
                    catalogName,
                    catalogRepositoryUrl,
                    chartIconUrl,
                    chartVersion_default,
                    chartVersion,
                    availableChartVersions
                } = await dispatch(
                    privateThunks.getChartInfos({
                        catalogId,
                        chartName,
                        chartVersion_pinned
                    })
                );

                if (getIsCanceled()) {
                    return;
                }

                const {
                    helmDependencies,
                    helmValuesSchema: helmValuesSchema_orUndefined,
                    helmChartSourceUrls,
                    helmValuesYaml
                } = await onyxiaApi.getHelmChartDetails({
                    catalogId,
                    chartName,
                    chartVersion
                });

                const hasHelmValuesSchema = helmValuesSchema_orUndefined !== undefined;

                const helmValuesSchema: JSONSchema = helmValuesSchema_orUndefined ?? {
                    type: "object",
                    properties: {}
                };

                if (getIsCanceled()) {
                    return;
                }

                const doInjectPersonalInfos =
                    projectManagement.selectors.canInjectPersonalInfos(getState());

                const { s3ConfigId, s3ConfigId_default } = (() => {
                    const s3Configs = s3ConfigManagement.selectors
                        .s3Configs(getState())
                        .filter(s3Config =>
                            doInjectPersonalInfos ? true : s3Config.origin === "project"
                        );

                    const s3ConfigId_default = (() => {
                        const s3Config = s3Configs.find(
                            s3Config => s3Config.isXOnyxiaDefault
                        );
                        if (s3Config === undefined) {
                            return undefined;
                        }

                        return s3Config.id;
                    })();

                    const s3ConfigId = (() => {
                        use_pinned_s3_config: {
                            if (s3ConfigId_pinned === undefined) {
                                break use_pinned_s3_config;
                            }
                            const s3Config = s3Configs.find(
                                s3Config => s3Config.id === s3ConfigId_pinned
                            );
                            if (s3Config === undefined) {
                                break use_pinned_s3_config;
                            }
                            return s3Config.id;
                        }

                        return s3ConfigId_default;
                    })();

                    return { s3ConfigId, s3ConfigId_default };
                })();

                const xOnyxiaContext = await dispatch(
                    protectedThunks.getXOnyxiaContext({
                        s3ConfigId,
                        doInjectPersonalInfos
                    })
                );

                if (getIsCanceled()) {
                    return;
                }

                const infoAmountInHelmValues = hasHelmValuesSchema
                    ? "user provided"
                    : "include values.yaml defaults";

                const {
                    helmValues: helmValues_default,
                    helmValuesSchema_forDataTextEditor,
                    isChartUsingS3
                } = computeHelmValues({
                    helmValuesSchema,
                    xOnyxiaContext,
                    helmValuesYaml,
                    infoAmountInHelmValues
                });

                {
                    const context = getContext(rootContext);

                    context.reComputeHelmValues = ({ infoAmountInHelmValues }) => {
                        const { helmValues: helmValues_default } = computeHelmValues({
                            helmValuesSchema,
                            xOnyxiaContext,
                            helmValuesYaml,
                            infoAmountInHelmValues
                        });

                        return { helmValues_default };
                    };
                }

                const friendlyName_default = chartName;

                const isShared_default = (() => {
                    const project =
                        projectManagement.protectedSelectors.currentProject(getState());

                    if (project.group === undefined) {
                        // NOTE: Not applicable
                        return undefined;
                    }

                    return false;
                })();

                dispatch(
                    actions.initialized({
                        readyState: {
                            catalogId,
                            chartName,
                            chartVersion,
                            chartVersion_default,
                            xOnyxiaContext,

                            friendlyName: friendlyName ?? friendlyName_default,
                            friendlyName_default,
                            isShared: isShared ?? isShared_default,
                            isShared_default,
                            s3Config: !isChartUsingS3
                                ? { isChartUsingS3: false }
                                : {
                                      isChartUsingS3: true,
                                      s3ConfigId,
                                      s3ConfigId_default
                                  },
                            helmDependencies,

                            helmValuesSchema,
                            helmValues_default,
                            helmValuesYaml,

                            helmValuesSchema_forDataTextEditor: hasHelmValuesSchema
                                ? helmValuesSchema_forDataTextEditor
                                : undefined,

                            chartIconUrl,
                            catalogRepositoryUrl,
                            catalogName,
                            k8sRandomSubdomain: xOnyxiaContext.k8s.randomSubdomain,
                            helmChartSourceUrls,
                            availableChartVersions,
                            infoAmountInHelmValues
                        },
                        helmValuesPatch: helmValuesPatch ?? []
                    })
                );

                if (autoLaunch) {
                    dispatch(thunks.launch());
                }
            })();

            return { cleanup };
        },
    changeInfoAmountInHelmValues:
        (params: {
            infoAmountInHelmValues: "user provided" | "include values.yaml defaults";
        }) =>
        (...args) => {
            const { infoAmountInHelmValues } = params;

            const [dispatch, getState, rootContext] = args;

            const { reComputeHelmValues } = getContext(rootContext);

            const { helmValues_default } = reComputeHelmValues({
                infoAmountInHelmValues
            });

            const restorableConfig = privateSelectors.restorableConfig(getState());

            assert(restorableConfig !== null);

            dispatch(
                actions.infoAmountInHelmValuesChanged({
                    helmValues_default,
                    helmValuesPatch: restorableConfig.helmValuesPatch,
                    infoAmountInHelmValues
                })
            );
        },
    restoreAllDefault:
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const restorableConfig = privateSelectors.restorableConfig(getState());

            assert(restorableConfig !== null);

            dispatch(
                thunks.initialize({
                    restorableConfig: {
                        catalogId: restorableConfig.catalogId,
                        chartName: restorableConfig.chartName,
                        chartVersion: undefined,
                        friendlyName: undefined,
                        helmValuesPatch: undefined,
                        isShared: undefined,
                        s3ConfigId: undefined
                    },
                    autoLaunch: false
                })
            );
        },
    changeChartVersion:
        (params: { chartVersion: string }) =>
        async (...args) => {
            const { chartVersion } = params;

            const [dispatch, getState] = args;

            const restorableConfig = privateSelectors.restorableConfig(getState());

            assert(restorableConfig !== null);

            if (restorableConfig.chartVersion === chartVersion) {
                // NOTE: No changes, skip.
                return;
            }

            dispatch(
                thunks.initialize({
                    restorableConfig: {
                        ...restorableConfig,
                        chartVersion
                    },
                    autoLaunch: false
                })
            );
        },
    changeS3Config:
        (params: { s3ConfigId: string }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { s3ConfigId } = params;

            const restorableConfig = privateSelectors.restorableConfig(getState());

            assert(restorableConfig !== null);

            if (restorableConfig.s3ConfigId === s3ConfigId) {
                // NOTE: No changes, skip.
                return;
            }

            dispatch(
                thunks.initialize({
                    restorableConfig: {
                        ...restorableConfig,
                        s3ConfigId
                    },
                    autoLaunch: false
                })
            );
        },
    changeFormFieldValue:
        (params: { formFieldValue: FormFieldValue; isAutocompleteSelection: boolean }) =>
        (...args) => {
            const [dispatch, getState] = args;

            const { formFieldValue, isAutocompleteSelection } = params;

            if (isAutocompleteSelection) {
                assert(
                    formFieldValue.fieldType === "text field",
                    [
                        "At the time of writing this assertion we only support",
                        "autocomplete on text field but his might no longer be the case"
                    ].join(" ")
                );

                dispatch(
                    actions.formFieldValueChanged_autocompleteSelection({
                        helmValuePath: formFieldValue.helmValuesPath,
                        optionValue: formFieldValue.value
                    })
                );

                return;
            }

            const rootForm = privateSelectors.rootForm(getState());

            assert(rootForm !== null);

            dispatch(actions.formFieldValueChanged({ formFieldValue, rootForm }));
        },
    onAutocompletePanelOpen:
        (params: { helmValuesPath: (string | number)[] }) =>
        async (...args) => {
            const { helmValuesPath } = params;

            const [dispatch] = args;

            dispatch(
                actions.autocompletePanelOpened({
                    helmValuesPath
                })
            );
        },
    changeFriendlyName:
        (friendlyName: string) =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.friendlyNameChanged({ friendlyName }));
        },
    addArrayItem:
        (params: { helmValuesPath: (string | number)[] }) =>
        (...args) => {
            const { helmValuesPath } = params;

            const [dispatch] = args;

            dispatch(actions.arrayItemAdded({ helmValuesPath }));
        },
    removeArrayItem:
        (params: { helmValuesPath: (string | number)[]; index: number }) =>
        (...args) => {
            const { helmValuesPath, index } = params;

            const [dispatch] = args;

            dispatch(actions.arrayItemRemoved({ helmValuesPath, index }));
        },
    changeIsShared:
        (params: { isShared: boolean }) =>
        (...args) => {
            const { isShared } = params;

            const [dispatch] = args;

            dispatch(actions.isSharedChanged({ isShared }));
        },
    changeHelmValues:
        (params: { helmValues: Record<string, Stringifyable> }) =>
        (...args) => {
            const { helmValues } = params;

            const [dispatch] = args;

            dispatch(actions.helmValuesChanged({ helmValues }));
        },
    launch:
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            dispatch(actions.launchStarted());

            const helmReleaseName = privateSelectors.helmReleaseName(getState());
            const helmValues = privateSelectors.helmValues(getState());
            const restorableConfig = privateSelectors.restorableConfig(getState());

            assert(helmReleaseName !== null);
            assert(helmValues !== null);
            assert(restorableConfig !== null);

            await onyxiaApi.helmInstall({
                helmReleaseName,
                catalogId: restorableConfig.catalogId,
                chartName: restorableConfig.chartName,
                chartVersion: restorableConfig.chartVersion,
                friendlyName: restorableConfig.friendlyName,
                isShared: restorableConfig.isShared,
                values: helmValues
            });

            dispatch(actions.launchCompleted());
        },
    additionalValidation:
        (params: { helmValues_candidate: Record<string, Stringifyable> }) =>
        (...args) => {
            const { helmValues_candidate } = params;

            const [, getState] = args;

            const wrap =
                privateSelectors.paramsOfComputeRootForm_butHelmValues(getState());

            assert(wrap !== null);

            try {
                computeRootForm({
                    ...wrap,
                    helmValues: helmValues_candidate
                });
            } catch (error) {
                assert(is<Error>(error));

                return { isValid: false as const, errorMsg: error.message };
            }

            return { isValid: true as const };
        }
} satisfies Thunks;

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<{
    evtCleanupInitialize: Evt<void>;
    reComputeHelmValues: (params: {
        infoAmountInHelmValues: "user provided" | "include values.yaml defaults";
    }) => { helmValues_default: Record<string, Stringifyable> };
}>();

export const protectedThunks = {
    getXOnyxiaContext:
        (params: { s3ConfigId: string | undefined; doInjectPersonalInfos: boolean }) =>
        async (...args): Promise<XOnyxiaContext> => {
            const { s3ConfigId, doInjectPersonalInfos } = params;

            const [
                dispatch,
                getState,
                { paramsOfBootstrapCore, secretsManager, onyxiaApi }
            ] = args;

            const { user } = await onyxiaApi.getUserAndProjects();

            const userConfigs = userConfigsUsecase.selectors.userConfigs(getState());

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            const servicePassword =
                projectManagement.selectors.servicePassword(getState());

            const project =
                projectManagement.protectedSelectors.currentProject(getState());

            const { decodedIdToken, accessToken, refreshToken } = await dispatch(
                userAuthentication.protectedThunks.getTokens()
            );

            const name = (() => {
                if (user.familyName === undefined && user.firstName === undefined) {
                    return user.username;
                }

                if (user.familyName === undefined) {
                    assert(user.firstName !== undefined);
                    return user.firstName;
                }

                return `${user.familyName} ${user.firstName}`;
            })();

            const xOnyxiaContext: XOnyxiaContext = {
                user: {
                    idep: user.username,
                    name,
                    email: user.email,
                    password: servicePassword,
                    ip: !doInjectPersonalInfos ? "0.0.0.0" : await onyxiaApi.getIp(),
                    darkMode: userConfigs.isDarkModeEnabled,
                    lang: paramsOfBootstrapCore.getCurrentLang(),
                    decodedIdToken,
                    accessToken,
                    refreshToken: refreshToken ?? "",
                    profile: !dispatch(userProfileForm.thunks.getIsEnabled())
                        ? undefined
                        : userProfileForm.protectedSelectors.userProfileValues_autoInjected(
                              getState()
                          )
                },
                service: {
                    oneTimePassword: generateRandomPassword()
                },
                project: {
                    id: project.id,
                    password: servicePassword,
                    basic: btoa(
                        unescape(encodeURIComponent(`${project.id}:${servicePassword}`))
                    )
                },
                git: !doInjectPersonalInfos
                    ? {
                          name: "",
                          email: "",
                          credentials_cache_duration: 0,
                          token: undefined
                      }
                    : {
                          name: userConfigs.gitName,
                          email: userConfigs.gitEmail,
                          credentials_cache_duration:
                              userConfigs.gitCredentialCacheDuration,
                          token: userConfigs.githubPersonalAccessToken ?? undefined
                      },
                vault: await (async () => {
                    const { vault } = region;

                    if (vault === undefined) {
                        return undefined;
                    }

                    return {
                        VAULT_ADDR: vault.url,
                        VAULT_TOKEN: !doInjectPersonalInfos
                            ? undefined
                            : (await secretsManager.getToken()).token,
                        VAULT_MOUNT: vault.kvEngine,
                        VAULT_TOP_DIR: dispatch(
                            secretExplorer.protectedThunks.getHomeDirectoryPath()
                        )
                    };
                })(),
                s3: await (async () => {
                    const s3Config = (() => {
                        if (s3ConfigId === undefined) {
                            return undefined;
                        }

                        const s3Configs =
                            s3ConfigManagement.selectors.s3Configs(getState());

                        const s3Config = s3Configs.find(
                            s3Config => s3Config.id === s3ConfigId
                        );

                        assert(s3Config !== undefined);

                        return s3Config;
                    })();

                    if (s3Config === undefined) {
                        return undefined;
                    }

                    const { host = "", port = 443 } =
                        s3Config.paramsOfCreateS3Client.url !== ""
                            ? parseUrl(s3Config.paramsOfCreateS3Client.url)
                            : {};

                    const { bucketName, objectName: objectNamePrefix } =
                        bucketNameAndObjectNameFromS3Path(s3Config.workingDirectoryPath);

                    const s3: XOnyxiaContext["s3"] = {
                        isEnabled: true,
                        AWS_ACCESS_KEY_ID: undefined,
                        AWS_SECRET_ACCESS_KEY: undefined,
                        AWS_SESSION_TOKEN: undefined,
                        AWS_BUCKET_NAME: bucketName,
                        AWS_DEFAULT_REGION: s3Config.region ?? "us-east-1",
                        AWS_S3_ENDPOINT: host,
                        port,
                        pathStyleAccess: s3Config.paramsOfCreateS3Client.pathStyleAccess,
                        objectNamePrefix,
                        workingDirectoryPath: s3Config.workingDirectoryPath,
                        isAnonymous: false
                    };

                    if (s3Config.paramsOfCreateS3Client.isStsEnabled) {
                        const s3Client = await dispatch(
                            s3ConfigManagement.protectedThunks.getS3ClientForSpecificConfig(
                                {
                                    s3ConfigId: s3Config.id
                                }
                            )
                        );

                        const tokens = await s3Client.getToken({ doForceRenew: false });

                        assert(tokens !== undefined);

                        s3.AWS_ACCESS_KEY_ID = tokens.accessKeyId;
                        s3.AWS_SECRET_ACCESS_KEY = tokens.secretAccessKey;
                        s3.AWS_SESSION_TOKEN = tokens.sessionToken;
                    } else if (
                        s3Config.paramsOfCreateS3Client.credentials !== undefined
                    ) {
                        s3.AWS_ACCESS_KEY_ID =
                            s3Config.paramsOfCreateS3Client.credentials.accessKeyId;
                        s3.AWS_SECRET_ACCESS_KEY =
                            s3Config.paramsOfCreateS3Client.credentials.secretAccessKey;
                        s3.AWS_SESSION_TOKEN =
                            s3Config.paramsOfCreateS3Client.credentials.sessionToken;
                    }

                    return s3;
                })(),
                region: {
                    defaultIpProtection: region.defaultIpProtection,
                    defaultNetworkPolicy: region.defaultNetworkPolicy,
                    allowedURIPattern: region.allowedURIPatternForUserDefinedInitScript,
                    kafka: region.kafka,
                    from: region.from,
                    tolerations: region.tolerations,
                    nodeSelector: region.nodeSelector,
                    startupProbe: region.startupProbe,
                    sliders: region.sliders,
                    resources: region.resources,
                    customValues: region.customValues ?? {},
                    openshiftSCC: region.openshiftSCC
                },
                k8s: {
                    domain: region.kubernetesClusterDomain,
                    ingressClassName: region.ingressClassName,
                    ingress: region.ingress,
                    route: region.route,
                    istio: region.istio,
                    randomSubdomain: `${Math.floor(Math.random() * 1000000)}`,
                    initScriptUrl: region.initScriptUrl,
                    useCertManager: region.certManager?.useCertManager,
                    certManagerClusterIssuer: region.certManager?.certManagerClusterIssuer
                },
                proxyInjection: region.proxyInjection,
                packageRepositoryInjection: region.packageRepositoryInjection,
                certificateAuthorityInjection: region.certificateAuthorityInjection
            };

            return xOnyxiaContext;
        },
    getXOnyxiaContext_autocompleteOptions:
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            const xOnyxiaContext_autocompleteOptions: DeepPartial<XOnyxiaContext> = {};

            if (dispatch(userProfileForm.thunks.getIsEnabled())) {
                (xOnyxiaContext_autocompleteOptions.user ??= {}).profile =
                    userProfileForm.protectedSelectors.userProfileValues_nonAutoInjected(
                        getState()
                    );
            }

            return xOnyxiaContext_autocompleteOptions;
        }
} satisfies Thunks;

export const privateThunks = {
    getChartInfos:
        (params: {
            catalogId: string;
            chartName: string;
            chartVersion_pinned: string | undefined;
        }) =>
        async (...args) => {
            const [, , { onyxiaApi }] = args;

            const { catalogId, chartName, chartVersion_pinned } = params;

            const [{ catalogs, chartsByCatalogId }, availableChartVersions] =
                await Promise.all([
                    onyxiaApi.getCatalogsAndCharts(),
                    onyxiaApi.getChartAvailableVersions({ catalogId, chartName })
                ] as const);

            const catalog = catalogs.find(({ id }) => id === catalogId);

            assert(catalog !== undefined);

            const chart = chartsByCatalogId[catalogId].find(
                ({ name }) => name === chartName
            );

            assert(chart !== undefined);

            const chartVersion_default = (() => {
                // NOTE: We assume that version are sorted from the most recent to the oldest.
                // We do not wat to automatically select prerelease or beta version (version that contains "-"
                // like 1.3.4-rc.0 or 1.2.3-beta.2 ).
                const chartVersion = availableChartVersions.find(
                    version => !version.includes("-")
                );

                if (chartVersion === undefined) {
                    const v = availableChartVersions[0];
                    assert(v !== undefined);
                    return v;
                }

                return chartVersion;
            })();

            const chartVersion = (() => {
                if (chartVersion_pinned !== undefined) {
                    if (
                        availableChartVersions.find(
                            version => version === chartVersion_pinned
                        ) === undefined
                    ) {
                        console.log(
                            [
                                `No ${chartVersion_pinned} version found for ${chartName} in ${catalog.repositoryUrl}.`,
                                `Falling back to default version ${chartVersion_default}`
                            ].join("\n")
                        );

                        return chartVersion_default;
                    }

                    return chartVersion_pinned;
                }

                return chartVersion_default;
            })();

            return {
                catalogName: catalog.name,
                catalogRepositoryUrl: catalog.repositoryUrl,
                chartIconUrl: chart.iconUrl,
                chartVersion_default,
                chartVersion,
                availableChartVersions
            };
        }
} satisfies Thunks;
