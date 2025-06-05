import { assert } from "tsafe/assert";
import { replaceAll } from "core/tools/String.prototype.replaceAll";

export type HelmReleaseLike = {
    urls: string[];
    postInstallInstructions: string | undefined;
};

export function getServiceOpenUrlAndMaybeAddPortToPostInstallInstructionsUrls(params: {
    helmRelease: HelmReleaseLike;
    kubernetesClusterIngressPort: number | undefined;
    preferredOpenUrlHostname: string | undefined;
}) {
    const {
        helmRelease: { urls, postInstallInstructions },
        kubernetesClusterIngressPort,
        preferredOpenUrlHostname
    } = params;

    let openUrl: string | undefined = undefined;
    let postInstallInstructions_patched: string | undefined = postInstallInstructions;

    function addPort(url: string, kubernetesClusterIngressPort: number): string {
        const url_obj = new URL(url);

        url_obj.port = `${kubernetesClusterIngressPort}`;

        return url_obj.href;
    }

    const urls_inPostInstallInstructions = ((): string[] => {
        if (postInstallInstructions === undefined) {
            return [];
        }

        if (urls.length === 0) {
            return [];
        }

        const urlRegex = new RegExp(
            urls
                .map(
                    url =>
                        url
                            .replace(/\/$/, "") // Remove trailing slash
                            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:[/?#][^\\s)]*)?" // Allow paths and query parameters
                )
                .join("|"),
            "gi"
        );

        const match = urlRegex.exec(postInstallInstructions);

        if (match === null) {
            return [];
        }

        return [...match];
    })();

    for (const url of urls_inPostInstallInstructions) {
        assert(postInstallInstructions_patched !== undefined);

        const url_withCorrectPort =
            kubernetesClusterIngressPort === undefined
                ? url
                : addPort(url, kubernetesClusterIngressPort);

        if (openUrl === undefined) {
            openUrl = url_withCorrectPort;
        }

        if (kubernetesClusterIngressPort === undefined) {
            break;
        }

        postInstallInstructions_patched = replaceAll(
            postInstallInstructions_patched,
            url,
            url_withCorrectPort
        );
    }

    set_openUrl: {
        if (openUrl !== undefined) {
            break set_openUrl;
        }

        if (urls.length === 0) {
            break set_openUrl;
        }

        const url_thatIsSubdomainOfPreferredOpenUrlHostname = preferredOpenUrlHostname
            ? urls.filter(e =>
                  new URL(e).hostname.endsWith("." + preferredOpenUrlHostname)
              )[0]
            : undefined;

        const url_firstInAlphabeticalOrder = [...urls].sort((a, b) =>
            a.localeCompare(b)
        )[0];

        const hostnameToOpen =
            url_thatIsSubdomainOfPreferredOpenUrlHostname ?? url_firstInAlphabeticalOrder;

        openUrl =
            kubernetesClusterIngressPort === undefined
                ? hostnameToOpen
                : addPort(hostnameToOpen, kubernetesClusterIngressPort);
    }

    return { openUrl, postInstallInstructions_patched };
}
