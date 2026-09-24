/** What the user is told about a provider, the same on its card and in its dialog. */
export type ProviderConnectionState = "connected" | "setup required" | "connection error";

export function getProviderConnectionState(params: {
    /** The provider needs a key from the user and there is none */
    isApiKeyMissing: boolean;
    connection: "not tested" | "testing" | "failed" | "succeeded";
}): ProviderConnectionState {
    const { isApiKeyMissing, connection } = params;

    if (isApiKeyMissing) {
        return "setup required";
    }

    switch (connection) {
        case "failed":
            return "connection error";
        case "succeeded":
            return "connected";
        case "not tested":
        case "testing":
            return "setup required";
    }
}
