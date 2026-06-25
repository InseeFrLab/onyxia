import { z } from "zod";

export type AiModel = { id: string; name: string };

/**
 * Lists the models exposed by a generic OpenAI-compatible `/models` endpoint,
 * authenticated with a bearer API key. Used by user-added custom providers.
 *
 * `name` is optional on purpose: plain OpenAI-compatible APIs (incl. OpenAI
 * itself) only return `id`. We fall back to `id` so those providers aren't
 * rejected. (The OpenWebUI region adapter has its own listing, since OpenWebUI
 * always returns `name`.)
 */
export async function fetchAiModels(params: {
    apiBase: string;
    token: string;
}): Promise<AiModel[]> {
    const { apiBase, token } = params;

    const response = await fetch(`${apiBase}/models`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to list models (${response.status})`);
    }

    const json = await response.json();

    let data;

    try {
        ({ data } = z
            .object({
                data: z.array(z.object({ id: z.string(), name: z.string().optional() }))
            })
            .parse(json));
    } catch {
        throw new Error("Unexpected /models response shape");
    }

    return data.map(({ id, name }) => ({ id, name: name ?? id }));
}
