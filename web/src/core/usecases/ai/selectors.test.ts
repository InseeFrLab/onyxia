import { describe, expect, it } from "vitest";
import type { State as RootState } from "core/bootstrap";
import { selectors } from "core/usecases/ai/selectors";

describe("ai selectors", () => {
    it("only exposes the active provider credential in the launcher context", () => {
        const rootState = {
            ai: {
                stateDescription: "initialized",
                activeProviderId: "active-provider",
                providers: [
                    {
                        kind: "custom",
                        id: "active-provider",
                        name: "Active provider",
                        protocol: "openai",
                        apiBase: "https://active.example.com/v1",
                        apiKey: "active-secret",
                        models: undefined,
                        selectedModelId: undefined
                    },
                    {
                        kind: "custom",
                        id: "inactive-provider",
                        name: "Inactive provider",
                        protocol: "openai",
                        apiBase: "https://inactive.example.com/v1",
                        apiKey: "inactive-secret",
                        models: undefined,
                        selectedModelId: undefined
                    }
                ]
            }
        } as RootState;

        expect(selectors.aiOnyxiaContext(rootState)).toStrictEqual({
            enabled: true,
            activeProvider: {
                id: "active-provider",
                isDefault: true,
                name: "Active provider",
                provider: "openai",
                apiBase: "https://active.example.com/v1",
                apiKey: "active-secret",
                models: undefined,
                selectedModel: undefined
            },
            providers: [
                {
                    id: "inactive-provider",
                    isDefault: false,
                    name: "Inactive provider",
                    provider: "openai",
                    apiBase: "https://inactive.example.com/v1",
                    models: undefined,
                    selectedModel: undefined
                }
            ]
        });
    });
});
