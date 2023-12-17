import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import { createPropertyThatThrowIfAccessed } from "redux-clean-architecture/tools/createObjectThatThrowsIfAccessed";
import memoize from "memoizee";

export const onyxiaApi: OnyxiaApi = {
    "getIp": memoize(() => Promise.resolve("0.0.0.0"), { "promise": true }),
    "onboard": () => Promise.resolve(),
    "getUserProjects": memoize(
        () =>
            Promise.resolve([
                {
                    "id": "my-project",
                    "name": "my project",
                    "bucket": "my-project",
                    "group": undefined,
                    "namespace": "my-namespace",
                    "vaultTopDir": "my-top-dir"
                }
            ]),
        { "promise": true }
    ),
    "getAvailableRegionsAndOidcParams": memoize(
        () =>
            Promise.resolve({
                "regions": [
                    {
                        "id": "dummy region",
                        "defaultIpProtection": undefined,
                        "defaultNetworkPolicy": undefined,
                        "servicesMonitoringUrlPattern": undefined,
                        "kubernetesClusterDomain": "kub.sspcloud.fr",
                        "ingressClassName": undefined,
                        "ingress": true,
                        "route": undefined,
                        "istio": undefined,
                        "customValues": undefined,
                        "initScriptUrl":
                            "https://InseeFrLab.github.io/onyxia/onyxia-init.sh",
                        "s3": undefined,
                        "allowedURIPatternForUserDefinedInitScript": "^https://",
                        "kafka": undefined,
                        "from": undefined,
                        "tolerations": undefined,
                        "nodeSelector": undefined,
                        "startupProbe": undefined,
                        "vault": undefined,
                        "proxyInjection": undefined,
                        "packageRepositoryInjection": undefined,
                        "certificateAuthorityInjection": undefined,
                        "kubernetes": undefined,
                        "sliders": {},
                        "resources": undefined
                    }
                ],
                "oidcParams": undefined
            }),
        { "promise": true }
    ),
    "getUser": memoize(
        () =>
            Promise.resolve({
                "username": "doej",
                "email": "john.doe@insee.fr",
                "familyName": "Doe",
                "firstName": "John"
            }),
        { "promise": true }
    ),
    ...createPropertyThatThrowIfAccessed("getCatalogsAndCharts", "Not mocked"),
    ...createPropertyThatThrowIfAccessed("getHelmChartDetails", "Not mocked"),
    ...createPropertyThatThrowIfAccessed("helmInstall", "Not mocked"),
    ...createPropertyThatThrowIfAccessed("listHelmReleases", "Not mocked"),
    ...createPropertyThatThrowIfAccessed("helmUninstall", "Not mocked"),
    ...createPropertyThatThrowIfAccessed("createAwsBucket", "Not mocked")
};
