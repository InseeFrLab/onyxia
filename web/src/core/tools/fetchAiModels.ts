import { z } from "zod";

export type AiModel = { id: string; name: string };

/** Lists the models exposed by a user-added provider using its native protocol. */
export async function fetchAiModels(params: {
    provider: string;
    apiBase: string;
    token: string;
}): Promise<AiModel[]> {
    const { provider, apiBase, token } = params;

    const headers: Record<string, string> =
        provider === "anthropic"
            ? {
                  "x-api-key": token,
                  "anthropic-version": "2023-06-01",
                  "anthropic-dangerous-direct-browser-access": "true"
              }
            : { Authorization: `Bearer ${token}` };

    const response = await fetch(`${apiBase}/models`, {
        headers
    });

    if (!response.ok) {
        throw new Error(`Failed to list models (${response.status})`);
    }

    const json = await response.json();

    if (provider === "anthropic") {
        try {
            const { data } = z
                .object({
                    data: z.array(
                        z.object({
                            id: z.string(),
                            display_name: z.string().optional()
                        })
                    )
                })
                .parse(json);

            return data.map(({ id, display_name }) => ({
                id,
                name: display_name ?? id
            }));
        } catch {
            throw new Error("Unexpected Anthropic /models response shape");
        }
    }

    try {
        const { data } = z
            .object({
                data: z.array(z.object({ id: z.string(), name: z.string().optional() }))
            })
            .parse(json);

        return data.map(({ id, name }) => ({ id, name: name ?? id }));
    } catch {
        throw new Error("Unexpected OpenAI-compatible /models response shape");
    }
}
