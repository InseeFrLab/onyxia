import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createCore, createUsecaseActions } from "clean-architecture";
import type { Context } from "core/bootstrap";
import * as providers from "../aiProvidersManagements";
import * as account from "./index";
import * as form from "../aiProviderFormUiController";
const mocks = vi.hoisted(() => ({
    context: undefined as unknown,
    getTokens: vi.fn(),
    save: vi.fn()
}));
vi.mock("core/rootContext", () => ({ getRootContext: () => mocks.context }));
vi.mock("core/adapters/oidc", () => ({
    createOidc: async () => ({ isUserLoggedIn: true, getTokens: mocks.getTokens }),
    mergeOidcParams: ({
        oidcParams,
        oidcParams_partial
    }: {
        oidcParams: Record<string, unknown>;
        oidcParams_partial: Record<string, unknown>;
    }) => ({ ...oidcParams, ...oidcParams_partial })
}));
vi.mock("core/usecases/userConfigs", () => ({
    selectors: {
        userConfigs: (state: { userConfigs: { aiConfigStr: string | null } }) =>
            state.userConfigs
    },
    thunks: {
        changeValue:
            ({ value }: { value: string }) =>
            async (dispatch: (action: unknown) => void) => {
                await mocks.save(value);
                dispatch({ type: "userConfigs/valueChanged", payload: value });
            }
    }
}));
function setup(params?: { aiConfigStr: string | null }) {
    const { aiConfigStr = null } = params ?? {};
    const userConfigs = {
        thunks: {},
        selectors: {},
        ...createUsecaseActions({
            name: "userConfigs",
            initialState: { aiConfigStr },
            reducers: {
                valueChanged: (state, { payload }: { payload: string }) => {
                    state.aiConfigStr = payload;
                }
            }
        })
    };
    const context = {
        aiConfig: {
            disable: false,
            disallowUserToAddProviders: false,
            providers: [
                {
                    name: "Exchange",
                    providerType: "openai-compatible",
                    apiBase: "https://example.com/api",
                    documentation: undefined,
                    models: undefined,
                    authentification: {
                        type: "api-key",
                        obtentionMethod: "open-webui-oidc-token-exchange",
                        oidcParams: {
                            issuerUri: undefined,
                            clientId: "bridge",
                            extraQueryParams_raw: undefined,
                            scope_spaceSeparated: undefined,
                            idleSessionLifetimeInSeconds: undefined
                        }
                    }
                },
                {
                    name: "Public",
                    providerType: "openai-compatible",
                    apiBase: "https://public.example/v1",
                    documentation: undefined,
                    models: ["a"],
                    authentification: { type: "none" }
                },
                {
                    name: "Keyed",
                    providerType: "openai-compatible",
                    apiBase: "https://keyed.example/v1",
                    documentation: undefined,
                    models: undefined,
                    authentification: {
                        type: "api-key",
                        obtentionMethod: "user-provided"
                    }
                }
            ]
        },
        oidc: { isUserLoggedIn: true },
        onyxiaApi: {
            getAvailableRegionsAndOidcParams: async () => ({
                oidcParams: { issuerUri: "https://issuer.example", clientId: "onyxia" }
            })
        },
        paramsOfBootstrapCore: {
            getCurrentLang: () => "en",
            transformBeforeRedirectForKeycloakTheme: ({
                authorizationUrl
            }: {
                authorizationUrl: string;
            }) => authorizationUrl
        }
    } as unknown as Context;
    mocks.context = context;
    const { core, dispatch } = createCore({
        context,
        usecases: {
            aiProvidersManagements: providers,
            aiAccountUiController: account,
            aiProviderFormUiController: form,
            userConfigs
        }
    });
    return {
        core,
        dispatch: dispatch as unknown as Parameters<
            ReturnType<typeof providers.protectedThunks.getAiContext>
        >[0]
    };
}
beforeEach(() => {
    mocks.save.mockReset().mockResolvedValue(undefined);
    mocks.getTokens.mockReset().mockResolvedValue({ accessToken: "oidc" });
    vi.stubGlobal(
        "fetch",
        vi.fn(
            async (url: string) =>
                new Response(
                    JSON.stringify(
                        url.endsWith("/models")
                            ? { data: [{ id: "a" }] }
                            : { token: "exchanged" }
                    )
                )
        )
    );
});
afterEach(() => vi.unstubAllGlobals());
it("exposes the account data and refreshes only the exchange token", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();
    const state = core.states.aiAccountUiController.getMain();
    expect(state.isReady).toBe(true);
    expect(state.providers?.map(p => p.canRefreshToken)).toEqual([true, false, false]);
    vi.mocked(fetch).mockClear();
    await core.functions.aiAccountUiController.refreshToken({ providerName: "Exchange" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
        "https://example.com/api/v1/auths/oauth/oidc/token/exchange",
        expect.anything()
    );
    expect(
        core.states.aiAccountUiController.getMain().providers?.[0].models.stateDescription
    ).toBe("loaded");
});
it("rejects token refresh for a provider without exchange authentication", async () => {
    const { core, dispatch } = setup();
    await core.functions.aiAccountUiController.load();
    vi.mocked(fetch).mockClear();
    await expect(
        dispatch(providers.thunks.refreshToken({ providerName: "Public" }))
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
});
it("creates a provider through the current form controller and selects its default", async () => {
    const { core, dispatch } = setup();
    await core.functions.aiAccountUiController.load();
    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeValue({ key: "name", value: "Personal" });
    creation.changeProviderType({ providerType: "openai" });
    await creation.testConnection();
    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        canSubmit: true,
        connectionTest: { stateDescription: "succeeded" }
    });
    await creation.submit();
    expect(core.states.aiProviderFormUiController.getMain().isOpen).toBe(false);
    await core.functions.aiAccountUiController.setSelectedModelIds({
        providerName: "Personal",
        modelIds: ["a"]
    });
    await core.functions.aiAccountUiController.setDefaultModel({ model: "Personal/a" });
    expect(await dispatch(providers.protectedThunks.getAiContext())).toMatchObject({
        defaultModel: "Personal/a",
        models: ["Exchange/a", "Public/a", "Personal/a"]
    });
});

it("selects every model of the providers absent from the user config, and the first one as default", async () => {
    const { core, dispatch } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeValue({ key: "name", value: "Personal" });
    creation.changeProviderType({ providerType: "openai" });
    await creation.testConnection();
    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        selectedModelIds_draft: ["a"]
    });
    await creation.submit();

    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        defaultModel: "Exchange/a"
    });
    expect(await dispatch(providers.protectedThunks.getAiContext())).toMatchObject({
        defaultModel: "Exchange/a",
        models: ["Exchange/a", "Public/a", "Personal/a"]
    });

    // Once the user filtered, their choice sticks
    await core.functions.aiAccountUiController.setSelectedModelIds({
        providerName: "Exchange",
        modelIds: []
    });
    expect(await dispatch(providers.protectedThunks.getAiContext())).toMatchObject({
        defaultModel: "Public/a",
        models: ["Public/a", "Personal/a"]
    });
});

it("prefills a unique provider name and saves it when model loading fails", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "mistral" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        formValues: { name: "Mistral" },
        canSubmit: true
    });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("unreachable"));
    await creation.testConnection();

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        connectionTest: { stateDescription: "failed" },
        canSubmit: true
    });

    await creation.submit();

    expect(core.states.aiProviderFormUiController.getMain().isOpen).toBe(false);
    expect(
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Mistral")?.models
    ).toMatchObject({ stateDescription: "not loaded" });

    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "mistral" });
    creation.changeProviderType({ providerType: "openai" });
    creation.changeProviderType({ providerType: "mistral" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        formValues: { name: "Mistral 2" }
    });
});

it("does not allow a custom provider to reuse an existing provider name", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "openai" });
    creation.changeValue({ key: "name", value: "Exchange" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        isNameValid: false,
        canSubmit: false
    });
});

it("keeps provider errors when another operation succeeds", async () => {
    const { core } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    await ui.refreshToken({ providerName: "Public" });
    await ui.setDefaultModel({ model: undefined });
    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        providers: [
            { name: "Exchange", operationState: "idle" },
            { name: "Public", operationState: "error" },
            { name: "Keyed", operationState: "idle" }
        ]
    });
});

it("allows model selection while a token refresh is pending", async () => {
    const { core } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    let resolveTokens!: (tokens: { accessToken: string }) => void;
    mocks.getTokens.mockReturnValue(
        new Promise(resolve => {
            resolveTokens = resolve;
        })
    );
    const refresh = ui.refreshToken({ providerName: "Exchange" });
    await ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    expect(core.states.aiAccountUiController.getMain().providers?.[0]).toMatchObject({
        operationState: "pending",
        selectedModelIds: ["a"]
    });
    resolveTokens({ accessToken: "renewed" });
    await refresh;
    expect(
        core.states.aiAccountUiController.getMain().providers?.[0].operationState
    ).toBe("idle");
});

it("updates selections immediately and saves the latest snapshot after an in-flight write", async () => {
    const { core } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    let finishSave!: () => void;
    mocks.save.mockImplementationOnce(
        () =>
            new Promise<void>(resolve => {
                finishSave = resolve;
            })
    );
    ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    await vi.waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    ui.setDefaultModel({ model: "Exchange/a" });
    ui.setSelectedModelIds({ providerName: "Exchange", modelIds: [] });
    ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        defaultModel: "Exchange/a",
        configSaveState: "pending"
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
    finishSave();
    await vi.waitFor(() =>
        expect(core.states.aiAccountUiController.getMain().configSaveState).toBe("idle")
    );
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mocks.save.mock.calls[1][0])).toMatchObject({
        excludedModelIdsByProviderName: { Exchange: [] },
        defaultModel: { providerName: "Exchange", modelId: "a" }
    });
});

it("keeps unsaved choices in memory after failure and retries them", async () => {
    const { core } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    mocks.save.mockRejectedValueOnce(new Error("offline"));
    ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    await vi.waitFor(() =>
        expect(core.states.aiAccountUiController.getMain().configSaveState).toBe("error")
    );
    expect(
        core.states.aiAccountUiController.getMain().providers?.[0].selectedModelIds
    ).toEqual(["a"]);
    ui.retrySave();
    await vi.waitFor(() =>
        expect(core.states.aiAccountUiController.getMain().configSaveState).toBe("idle")
    );
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][0]).toBe(mocks.save.mock.calls[0][0]);
});

it("tests a typed API key without saving it, then saves it without testing again", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;
    const getKeyedProvider = () =>
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Keyed");

    edition.open({ providerName: "Keyed" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        providerOrigin: "configured by admin",
        canEditApiKey: true,
        canSubmit: false
    });
    expect(() => edition.changeValue({ key: "name", value: "Renamed" })).toThrow();

    edition.changeValue({ key: "apiKey", value: " typed " });

    expect(core.states.aiProviderFormUiController.getMain().canSubmit).toBe(true);

    edition.changeValue({ key: "apiKey", value: "" });

    expect(core.states.aiProviderFormUiController.getMain().canSubmit).toBe(false);

    edition.changeValue({ key: "apiKey", value: " typed " });

    vi.mocked(fetch).mockClear();
    mocks.save.mockClear();

    await edition.testConnection();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("https://keyed.example/v1/models", {
        headers: { Authorization: "Bearer typed" },
        signal: expect.anything()
    });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(getKeyedProvider()).toMatchObject({
        auth: { stateDescription: "api-key not provided" }
    });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    vi.mocked(fetch).mockClear();

    await edition.submit();

    expect(core.states.aiProviderFormUiController.getMain().isOpen).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalled();
    expect(getKeyedProvider()).toMatchObject({
        auth: { stateDescription: "authenticated", apiKey: "typed" },
        models: { stateDescription: "loaded", availableModels: [{ id: "a" }] },
        selectedModelIds: ["a"]
    });
});

it("saves the model selection right away when the models are the saved ones", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        isModelSelectionSavedImmediately: true,
        canSubmit: false
    });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    expect(
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Public")?.selectedModelIds
    ).toEqual(["a"]);
    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        isOpen: true,
        canSubmit: false
    });
});

it("gives a provider without authentication the same state on its card and in its dialog", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const getCardState = () =>
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Public")?.connectionState;

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    // Reachable: whether models are picked doesn't matter
    expect(getCardState()).toBe("connected");
    expect(core.states.aiProviderFormUiController.getMain().connectionState).toBe(
        "connected"
    );
});

it("actually calls a provider whose models are pinned by the admin when testing it", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    vi.mocked(fetch).mockClear();

    await edition.testConnection();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("https://public.example/v1/models", {
        headers: {},
        signal: expect.anything()
    });
    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        connectionTest: { stateDescription: "succeeded", availableModels: [{ id: "a" }] }
    });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("unreachable"));

    await edition.testConnection();

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        connectionTest: { stateDescription: "failed" },
        connectionState: "connection error"
    });
});

it("reports an unreachable provider with pinned models, whose models stay selectable", async () => {
    const { core } = setup();

    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
        if (String(url) === "https://public.example/v1/models") {
            throw new Error("unreachable");
        }

        return new Response(
            JSON.stringify(
                String(url).endsWith("/models")
                    ? { data: [{ id: "a" }] }
                    : { token: "exchanged" }
            )
        );
    });

    await core.functions.aiAccountUiController.load();

    const getPublic = () =>
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Public");

    // The card tells the truth, but still offers the models pinned by the admin
    expect(getPublic()).toMatchObject({
        connectionState: "connection error",
        models: { stateDescription: "loaded", availableModels: [{ id: "a" }] }
    });

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    expect(core.states.aiProviderFormUiController.getMain()).toMatchObject({
        connectionTest: { stateDescription: "failed" },
        connectionState: "connection error",
        availableModels: [{ id: "a" }]
    });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    expect(getPublic()?.selectedModelIds).toEqual(["a"]);
});

it("doesn't report a provider as connected once its API key is removed", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;
    const getCardState = () =>
        core.states.aiAccountUiController
            .getMain()
            .providers?.find(provider => provider.name === "Keyed")?.connectionState;

    edition.open({ providerName: "Keyed" });
    edition.changeValue({ key: "apiKey", value: "typed" });
    await edition.testConnection();
    await edition.submit();

    expect(getCardState()).toBe("connected");

    edition.open({ providerName: "Keyed" });
    edition.changeValue({ key: "apiKey", value: "" });
    await edition.submit();

    // What was listed with the removed key must not be taken for a connection
    expect(getCardState()).toBe("setup required");
});

it("groups the default model options by provider, leaving out the ones without models", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    await core.functions.aiAccountUiController.setSelectedModelIds({
        providerName: "Exchange",
        modelIds: []
    });

    expect(core.states.aiAccountUiController.getMain().defaultModelOptionGroups).toEqual([
        { providerName: "Public", options: [{ value: "Public/a", modelId: "a" }] }
    ]);
});

it("requires the user to reset a stored config that can't be read back", async () => {
    const { core } = setup({ aiConfigStr: "{ not json" });
    await core.functions.aiAccountUiController.load();

    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        isReady: false,
        isConfigUnreadable: true
    });
    // Nothing is overwritten behind the user's back
    expect(mocks.save).not.toHaveBeenCalled();

    await core.functions.aiAccountUiController.resetConfig();

    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(core.states.aiAccountUiController.getMain().isReady).toBe(true);
});
