/** What the user is told about a provider, the same on its card and in its dialog. */
export type ProviderConnectionState = "connected" | "setup required" | "connection error";

export function getProviderConnectionState(params: {
    connection: "not tested" | "testing" | "failed" | "succeeded";
}): ProviderConnectionState {
    const { connection } = params;

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
