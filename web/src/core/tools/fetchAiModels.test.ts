import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAiModels } from "./fetchAiModels";

describe(fetchAiModels.name, () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("lists models from an OpenAI-compatible endpoint", async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: [{ id: "model-a" }, { id: "model-b", name: "Model B" }]
                }),
                { status: 200 }
            )
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            fetchAiModels({
                provider: "openai-compatible",
                apiBase: "https://gateway.example.com/v1",
                token: "openai-key"
            })
        ).resolves.toStrictEqual([
            { id: "model-a", name: "model-a" },
            { id: "model-b", name: "Model B" }
        ]);
        expect(fetchMock).toHaveBeenCalledWith("https://gateway.example.com/v1/models", {
            headers: { Authorization: "Bearer openai-key" }
        });
    });

    it("uses the native Anthropic authentication and response shape", async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: [
                        {
                            id: "claude-sonnet-4-6",
                            display_name: "Claude Sonnet 4.6"
                        }
                    ]
                }),
                { status: 200 }
            )
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            fetchAiModels({
                provider: "anthropic",
                apiBase: "https://api.anthropic.com/v1",
                token: "anthropic-key"
            })
        ).resolves.toStrictEqual([
            { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" }
        ]);
        expect(fetchMock).toHaveBeenCalledWith("https://api.anthropic.com/v1/models", {
            headers: {
                "x-api-key": "anthropic-key",
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            }
        });
    });
});
