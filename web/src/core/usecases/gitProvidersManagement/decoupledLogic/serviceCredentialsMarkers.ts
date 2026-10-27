import type { Stringifyable } from "core/tools/Stringifyable";

/**
 * What is only created when the user clicks "Launch" is a marker in the XOnyxia context,
 * replaced in the helm values sent to the API, never in the form's state: neither the
 * saved configurations nor the shared links hold a secret. A value edited by hand is
 * no longer a marker and is kept.
 * - access-token: the token created for the service (scoped-access-token), or the
 *   access token of the service's OAuth authorization (git.token, first clone).
 * - refresh-token: the refresh token of the service's OAuth authorization.
 */
export type ServiceCredentialsMarker = {
    kind: ServiceCredentialsMarker.Kind;
    providerId: string;
};

export namespace ServiceCredentialsMarker {
    export type Kind = "access-token" | "refresh-token";
}

const PREFIX = "onyxia-git-created-at-launch";

const kinds: ServiceCredentialsMarker.Kind[] = ["access-token", "refresh-token"];

export function createServiceCredentialsMarker(marker: ServiceCredentialsMarker): string {
    const { kind, providerId } = marker;

    // NOTE: The provider id goes last, it can contain ":" (host with a port).
    return `${PREFIX}:${kind}:${providerId}`;
}

export function parseServiceCredentialsMarker(
    value: string
): ServiceCredentialsMarker | undefined {
    const match = value.match(new RegExp(`^${PREFIX}:([a-z-]+):(.+)$`));

    if (match === null) {
        return undefined;
    }

    const [, kind, providerId] = match;

    if (!kinds.includes(kind as ServiceCredentialsMarker.Kind)) {
        return undefined;
    }

    return { kind: kind as ServiceCredentialsMarker.Kind, providerId };
}

/** The markers left in the helm values, each once */
export function collectServiceCredentialsMarkers(value: Stringifyable): string[] {
    const markers = new Set<string>();

    const walk = (value: Stringifyable): void => {
        if (typeof value === "string") {
            if (parseServiceCredentialsMarker(value) !== undefined) {
                markers.add(value);
            }
            return;
        }

        if (value === null || typeof value !== "object") {
            return;
        }

        (Array.isArray(value) ? value : Object.values(value)).forEach(walk);
    };

    walk(value);

    return [...markers];
}

/** In depth: the markers can be inside git.providers, an array of objects */
export function replaceServiceCredentialsMarkers<T extends Stringifyable>(params: {
    value: T;
    valueByMarker: Record<string, string>;
}): T {
    const { valueByMarker } = params;

    const replace = (value: Stringifyable): Stringifyable => {
        if (typeof value === "string") {
            return valueByMarker[value] ?? value;
        }

        if (value === null || typeof value !== "object") {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map(replace);
        }

        return Object.fromEntries(
            Object.entries(value).map(([key, value]) => [key, replace(value)])
        );
    };

    return replace(params.value) as T;
}
