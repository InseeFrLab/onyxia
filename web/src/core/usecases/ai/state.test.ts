import { describe, expect, it } from "vitest";
import { actions, reducer } from "core/usecases/ai/state";

function createInitializedState(selectedModelId: string | undefined) {
    return reducer(
        undefined,
        actions.initialized({
            providers: [
                {
                    kind: "custom",
                    id: "provider-a",
                    name: "Provider A",
                    protocol: "openai",
                    apiBase: "https://ai.example.com/api",
                    apiKey: "secret",
                    models: { stateDescription: "fetching" },
                    selectedModelId
                }
            ],
            activeProviderId: "provider-a"
        })
    );
}

describe("ai state", () => {
    it("keeps the use case initialized when a managed gateway authentication fails", () => {
        const initializedState = reducer(
            undefined,
            actions.initialized({
                providers: [
                    {
                        kind: "managed",
                        id: "managed-provider",
                        name: "Managed provider",
                        protocol: "openai",
                        apiBase: "https://ai.example.com/api",
                        webUiUrl: "https://ai.example.com",
                        description: undefined,
                        accountCreation: undefined,
                        auth: { stateDescription: "fetching" },
                        models: undefined,
                        selectedModelId: undefined
                    }
                ],
                activeProviderId: undefined
            })
        );

        const state = reducer(
            initializedState,
            actions.managedAuthRefreshed({
                providerId: "managed-provider",
                auth: { stateDescription: "error" }
            })
        );

        expect(state).toMatchObject({
            stateDescription: "initialized",
            providers: [{ auth: { stateDescription: "error" } }]
        });
    });

    it("replaces a stale model selection when the catalog is refreshed", () => {
        const state = reducer(
            createInitializedState("removed-model"),
            actions.modelsLoaded({
                providerId: "provider-a",
                models: [
                    { id: "available-model", name: "Available model" },
                    { id: "other-model", name: "Other model" }
                ]
            })
        );

        expect(state).toMatchObject({
            stateDescription: "initialized",
            providers: [{ selectedModelId: "available-model" }]
        });
    });

    it("keeps a model selection that is still available", () => {
        const state = reducer(
            createInitializedState("selected-model"),
            actions.modelsLoaded({
                providerId: "provider-a",
                models: [
                    { id: "first-model", name: "First model" },
                    { id: "selected-model", name: "Selected model" }
                ]
            })
        );

        expect(state).toMatchObject({
            stateDescription: "initialized",
            providers: [{ selectedModelId: "selected-model" }]
        });
    });
});
