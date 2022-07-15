import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";
import { createPropertyThatThrowIfAccessed } from "core/tools/createObjectThatThrowsIfAccessed";

import memoize from "memoizee";

export function createMockOnyxiaApiClient(): OnyxiaApiClient {
    return {
        "getIp": memoize(() => Promise.resolve("0.0.0.0"), { "promise": true }),
        "getUserProjects": memoize(
            () =>
                Promise.resolve([
                    {
                        "id": "my-project",
                        "name": "my project",
                        "bucket": "my-project",
                        "namespace": "my-namespace",
                        "vaultTopDir": "my-top-dir",
                    },
                ]),
            { "promise": true },
        ),
        "getAvailableRegions": memoize(
            () =>
                Promise.resolve([
                    {
                        "id": "dummy region",
                        "defaultIpProtection": undefined,
                        "defaultNetworkPolicy": undefined,
                        "servicesMonitoringUrlPattern": undefined,
                        "kubernetesClusterDomain": "kub.sspcloud.fr",
                        "initScriptUrl":
                            "https://InseeFrLab.github.io/onyxia/onyxia-init.sh",
                        "s3": undefined,
                        "allowedURIPatternForUserDefinedInitScript": "^https://",
                        "kafka": undefined,
                        "from": undefined,
                        "tolerations": undefined,
                        "nodeSelector": undefined,
                        "startupProbe": undefined,
                    },
                ]),
            { "promise": true },
        ),
        ...createPropertyThatThrowIfAccessed("getCatalogs", "Not mocked"),
        ...createPropertyThatThrowIfAccessed("getPackageConfig", "Not mocked"),
        ...createPropertyThatThrowIfAccessed("launchPackage", "Not mocked"),
        ...createPropertyThatThrowIfAccessed("getRunningServices", "Not mocked"),
        ...createPropertyThatThrowIfAccessed("stopService", "Not mocked"),
        ...createPropertyThatThrowIfAccessed("createAwsBucket", "Not mocked"),
    };
}
