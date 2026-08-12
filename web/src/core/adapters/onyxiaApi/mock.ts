import type {
    OnyxiaApi,
    OidcParams,
    Project,
    DeploymentRegion
} from "core/ports/OnyxiaApi";
import {
    createObjectThatThrowsIfAccessed,
    createObjectWithSomePropertiesThatThrowIfAccessed,
    THROW_IF_ACCESSED
} from "clean-architecture";
import { id } from "tsafe";

export function createOnyxiaApi(params: {
    oidcParams: OidcParams | undefined;
    getDecodedIdTokenSub: () => string;
}): OnyxiaApi {
    const { oidcParams, getDecodedIdTokenSub } = params;

    const userAndProjects: Awaited<ReturnType<OnyxiaApi["getUserAndProjects"]>> = {
        user: createObjectThatThrowsIfAccessed({
            debugMessage: "Can't access User provided from the API, No Onyxia API"
        }),
        projects: [
            id<Project>({
                id: "virtual",
                group: undefined,
                name: "virtual",
                get vaultTopDir() {
                    return getDecodedIdTokenSub();
                },
                namespace: "virtual"
            })
        ]
    };

    const availableRegionsAndOidcParams: Awaited<
        ReturnType<OnyxiaApi["getAvailableRegionsAndOidcParams"]>
    > = {
        oidcParams,
        regions: [
            createObjectWithSomePropertiesThatThrowIfAccessed<DeploymentRegion>(
                {
                    id: "virtual",
                    vault: undefined,
                    kubernetes: undefined,
                    allowedURIPatternForUserDefinedInitScript: THROW_IF_ACCESSED,
                    certificateAuthorityInjection: THROW_IF_ACCESSED,
                    certManager: THROW_IF_ACCESSED,
                    customValues: THROW_IF_ACCESSED,
                    defaultIpProtection: THROW_IF_ACCESSED,
                    defaultNetworkPolicy: THROW_IF_ACCESSED,
                    from: THROW_IF_ACCESSED,
                    ingress: THROW_IF_ACCESSED,
                    ingressClassName: THROW_IF_ACCESSED,
                    initScriptUrl: THROW_IF_ACCESSED,
                    istio: THROW_IF_ACCESSED,
                    kafka: THROW_IF_ACCESSED,
                    kubernetesClusterDomain: THROW_IF_ACCESSED,
                    kubernetesClusterIngressPort: THROW_IF_ACCESSED,
                    nodeSelector: THROW_IF_ACCESSED,
                    openshiftSCC: THROW_IF_ACCESSED,
                    packageRepositoryInjection: THROW_IF_ACCESSED,
                    proxyInjection: THROW_IF_ACCESSED,
                    resources: THROW_IF_ACCESSED,
                    route: THROW_IF_ACCESSED,
                    servicesMonitoringUrlPattern: THROW_IF_ACCESSED,
                    sliders: THROW_IF_ACCESSED,
                    startupProbe: THROW_IF_ACCESSED,
                    tolerations: THROW_IF_ACCESSED
                },
                "Mock deployment region used beyond it's intended scope"
            )
        ]
    };

    return createObjectWithSomePropertiesThatThrowIfAccessed<OnyxiaApi>({
        getUserAndProjects: () => Promise.resolve(userAndProjects),
        getAvailableRegionsAndOidcParams: () =>
            Promise.resolve(availableRegionsAndOidcParams),
        onboard: async () => {},
        getCatalogsAndCharts: THROW_IF_ACCESSED,
        changeHelmReleaseFriendlyName: THROW_IF_ACCESSED,
        changeHelmReleaseSharedStatus: THROW_IF_ACCESSED,
        getChartAvailableVersions: THROW_IF_ACCESSED,
        getHelmChartDetails: THROW_IF_ACCESSED,
        getIp: THROW_IF_ACCESSED,
        getQuotas: THROW_IF_ACCESSED,
        getUserProfileJsonSchema: THROW_IF_ACCESSED,
        helmInstall: THROW_IF_ACCESSED,
        helmUninstall: THROW_IF_ACCESSED,
        helmUpgradeGlobalSuspend: THROW_IF_ACCESSED,
        kubectlLogs: THROW_IF_ACCESSED,
        listHelmReleases: THROW_IF_ACCESSED,
        subscribeToClusterEvents: THROW_IF_ACCESSED
    });
}
