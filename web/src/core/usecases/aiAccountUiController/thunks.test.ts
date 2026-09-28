import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createCore, createUsecaseActions } from "clean-architecture";
import type { Context } from "core/bootstrap";
import * as providers from "../aiProvidersManagements";
import * as account from "./index";
import * as form from "../aiProviderFormUiController";
import { assert } from "tsafe/assert";
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
    const getProvider = (providerName: string) =>
        core.states.aiProvidersManagements
            .getAiProviders()
            ?.find(aiProvider => aiProvider.name === providerName);
    const getCard = (providerName: string) => {
        const view = core.states.aiAccountUiController.getMain();
        assert(view.isReady);
        return view.providerCards.find(card => card.name === providerName);
    };
    const getCreateDialog = () =>
        core.states.aiProviderFormUiController.getCreateDialog();
    const getManageDialog = () =>
        core.states.aiProviderFormUiController.getManageDialog();
    return {
        core,
        getProvider,
        getCard,
        getCreateDialog,
        getManageDialog,
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
it("offers to refresh the credentials of the exchange provider only, and refreshes only its token", async () => {
    const { core, getProvider, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();
    const edition = core.functions.aiProviderFormUiController;
    expect(
        ["Exchange", "Public", "Keyed"].map(providerName => {
            edition.open({ providerName });
            const dialog = getManageDialog();
            assert(dialog.isOpen);
            return dialog.credentialsRefresh !== undefined;
        })
    ).toEqual([true, false, false]);
    edition.open({ providerName: "Exchange" });
    vi.mocked(fetch).mockClear();
    await edition.refreshCredentials();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
        "https://example.com/api/v1/auths/oauth/oidc/token/exchange",
        expect.anything()
    );
    expect(getProvider("Exchange")?.models.stateDescription).toBe("loaded");
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
    const { core, dispatch, getCreateDialog } = setup();
    await core.functions.aiAccountUiController.load();
    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeValue({ key: "name", value: "Personal" });
    creation.changeProviderType({ providerType: "openai" });
    await creation.testConnection();
    expect(getCreateDialog()).toMatchObject({
        canSave: true,
        connectionTest: { state: "succeeded" }
    });
    await creation.submit();
    expect(getCreateDialog().isOpen).toBe(false);
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
    const { core, dispatch, getCreateDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeValue({ key: "name", value: "Personal" });
    creation.changeProviderType({ providerType: "openai" });
    await creation.testConnection();
    expect(getCreateDialog()).toMatchObject({
        models: { available: ["a"], selected: ["a"] }
    });
    await creation.submit();

    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        defaultModel: { value: "Exchange/a" }
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
    const { core, getProvider, getCreateDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "mistral" });

    expect(getCreateDialog()).toMatchObject({
        name: { value: "Mistral" },
        canSave: true
    });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("unreachable"));
    await creation.testConnection();

    expect(getCreateDialog()).toMatchObject({
        connectionTest: { state: "failed" },
        canSave: true
    });

    await creation.submit();

    expect(getCreateDialog().isOpen).toBe(false);
    expect(getProvider("Mistral")?.models).toMatchObject({
        stateDescription: "not loaded"
    });

    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "mistral" });
    creation.changeProviderType({ providerType: "openai" });
    creation.changeProviderType({ providerType: "mistral" });

    expect(getCreateDialog()).toMatchObject({
        name: { value: "Mistral 2" }
    });
});

it("does not allow a custom provider to reuse an existing provider name", async () => {
    const { core, getCreateDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const creation = core.functions.aiProviderFormUiController;
    creation.open({ providerName: undefined });
    creation.changeProviderType({ providerType: "openai" });
    creation.changeValue({ key: "name", value: "Exchange" });

    expect(getCreateDialog()).toMatchObject({
        name: { isInvalid: true },
        canSave: false
    });
});

it("reports a failed credentials refresh as a connection failure", async () => {
    const { core, getCard, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;
    edition.open({ providerName: "Exchange" });

    mocks.getTokens.mockRejectedValueOnce(new Error("offline"));
    await edition.refreshCredentials();

    expect(getManageDialog()).toMatchObject({
        alert: "connection failed",
        connectionState: "connection error",
        credentialsRefresh: { isRefreshing: false }
    });
    expect(getCard("Exchange")?.connectionState).toBe("connection error");
});

it("allows model selection from the card while a token refresh is pending", async () => {
    const { core, getCard, getManageDialog } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    const edition = core.functions.aiProviderFormUiController;
    edition.open({ providerName: "Exchange" });
    let resolveTokens!: (tokens: { accessToken: string }) => void;
    mocks.getTokens.mockReturnValue(
        new Promise(resolve => {
            resolveTokens = resolve;
        })
    );
    const refresh = edition.refreshCredentials();
    await ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    expect(getCard("Exchange")?.models).toMatchObject({
        selected: ["a"],
        isDisabled: false
    });
    // In the dialog, nothing can be done until the new credentials are known
    expect(getManageDialog()).toMatchObject({
        credentialsRefresh: { isRefreshing: true },
        connectionTest: { canTest: false },
        models: { isDisabled: true },
        canSave: false
    });
    resolveTokens({ accessToken: "renewed" });
    await refresh;
    expect(getManageDialog()).toMatchObject({
        credentialsRefresh: { isRefreshing: false },
        connectionState: "connected"
    });
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
        defaultModel: { value: "Exchange/a" },
        hasSaveFailed: false
    });
    expect(core.states.aiProvidersManagements.getConfigSaveState()).toBe("pending");
    expect(mocks.save).toHaveBeenCalledTimes(1);
    finishSave();
    await vi.waitFor(() =>
        expect(core.states.aiProvidersManagements.getConfigSaveState()).toBe("idle")
    );
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mocks.save.mock.calls[1][0])).toMatchObject({
        excludedModelIdsByProviderName: { Exchange: [] },
        defaultModel: { providerName: "Exchange", modelId: "a" }
    });
});

it("keeps unsaved choices in memory after failure and retries them", async () => {
    const { core, getCard } = setup();
    const ui = core.functions.aiAccountUiController;
    await ui.load();
    mocks.save.mockRejectedValueOnce(new Error("offline"));
    ui.setSelectedModelIds({ providerName: "Exchange", modelIds: ["a"] });
    await vi.waitFor(() =>
        expect(core.states.aiAccountUiController.getMain()).toMatchObject({
            hasSaveFailed: true
        })
    );
    expect(getCard("Exchange")?.models.selected).toEqual(["a"]);
    ui.retrySave();
    await vi.waitFor(() =>
        expect(core.states.aiAccountUiController.getMain()).toMatchObject({
            hasSaveFailed: false
        })
    );
    await vi.waitFor(() =>
        expect(core.states.aiProvidersManagements.getConfigSaveState()).toBe("idle")
    );
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][0]).toBe(mocks.save.mock.calls[0][0]);
});

it("tests a typed API key without saving it, then saves it without testing again", async () => {
    const { core, getProvider, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Keyed" });

    expect(getManageDialog()).toMatchObject({
        origin: "configured by admin",
        configuration: undefined,
        apiKey: { value: "", isEditable: true },
        alert: "api-key not provided",
        canSave: false
    });
    expect(() => edition.changeValue({ key: "name", value: "Renamed" })).toThrow();

    edition.changeValue({ key: "apiKey", value: " typed " });

    expect(getManageDialog()).toMatchObject({ canSave: true, alert: undefined });

    edition.changeValue({ key: "apiKey", value: "" });

    expect(getManageDialog()).toMatchObject({ canSave: false });

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
    expect(getProvider("Keyed")).toMatchObject({
        auth: { stateDescription: "api-key not provided" }
    });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    vi.mocked(fetch).mockClear();

    await edition.submit();

    expect(getManageDialog().isOpen).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalled();
    expect(getProvider("Keyed")).toMatchObject({
        auth: { stateDescription: "authenticated", apiKey: "typed" },
        models: { stateDescription: "loaded", availableModels: [{ id: "a" }] },
        selectedModelIds: ["a"]
    });
});

it("saves the model selection right away when the models are the saved ones", async () => {
    const { core, getCard, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    expect(getManageDialog()).toMatchObject({ canSave: false });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    expect(getCard("Public")?.models.selected).toEqual(["a"]);
    expect(getManageDialog()).toMatchObject({
        isOpen: true,
        canSave: false
    });
});

it("gives a provider without authentication the same state on its card and in its dialog", async () => {
    const { core, getCard, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    // Reachable: whether models are picked doesn't matter
    expect(getCard("Public")?.connectionState).toBe("connected");
    expect(getManageDialog()).toMatchObject({ connectionState: "connected" });
});

it("actually calls a provider whose models are pinned by the admin when testing it", async () => {
    const { core, getManageDialog } = setup();
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
    expect(getManageDialog()).toMatchObject({
        connectionState: "connected",
        models: { available: ["a"] }
    });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("unreachable"));

    await edition.testConnection();

    expect(getManageDialog()).toMatchObject({
        alert: "connection failed",
        connectionState: "connection error"
    });
});

it("reports an unreachable provider with pinned models, whose models stay selectable", async () => {
    const { core, getCard, getManageDialog } = setup();

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

    // The card tells the truth, but still offers the models pinned by the admin
    expect(getCard("Public")).toMatchObject({
        connectionState: "connection error",
        models: { available: ["a"], isDisabled: false }
    });

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Public" });

    expect(getManageDialog()).toMatchObject({
        alert: "connection failed",
        connectionState: "connection error",
        models: { available: ["a"] }
    });

    edition.changeSelectedModelIds({ selectedModelIds: ["a"] });

    expect(getCard("Public")?.models.selected).toEqual(["a"]);
});

it("doesn't report a provider as connected once its API key is removed", async () => {
    const { core, getCard } = setup();
    await core.functions.aiAccountUiController.load();

    const edition = core.functions.aiProviderFormUiController;

    edition.open({ providerName: "Keyed" });
    edition.changeValue({ key: "apiKey", value: "typed" });
    await edition.testConnection();
    await edition.submit();

    expect(getCard("Keyed")?.connectionState).toBe("connected");

    edition.open({ providerName: "Keyed" });
    edition.changeValue({ key: "apiKey", value: "" });
    await edition.submit();

    // What was listed with the removed key must not be taken for a connection
    expect(getCard("Keyed")?.connectionState).toBe("setup required");
});

it("deletes a provider created by the user from its dialog", async () => {
    const { core, getCard, getManageDialog } = setup();
    await core.functions.aiAccountUiController.load();

    const form = core.functions.aiProviderFormUiController;
    form.open({ providerName: undefined });
    form.changeProviderType({ providerType: "openai" });
    await form.submit();

    form.open({ providerName: "OpenAI" });
    expect(getManageDialog()).toMatchObject({ canDelete: true });

    await form.deleteProvider();

    expect(getManageDialog().isOpen).toBe(false);
    expect(getCard("OpenAI")).toBeUndefined();
});

it("groups the default model options by provider, leaving out the ones without models", async () => {
    const { core } = setup();
    await core.functions.aiAccountUiController.load();

    await core.functions.aiAccountUiController.setSelectedModelIds({
        providerName: "Exchange",
        modelIds: []
    });

    expect(core.states.aiAccountUiController.getMain()).toMatchObject({
        defaultModel: {
            optionGroups: [
                { providerName: "Public", options: [{ value: "Public/a", modelId: "a" }] }
            ]
        }
    });
});

it("requires the user to reset a stored config that can't be read back", async () => {
    const { core } = setup({ aiConfigStr: "{ not json" });
    await core.functions.aiAccountUiController.load();

    expect(core.states.aiAccountUiController.getMain()).toEqual({
        isReady: false,
        stateDescription: "unreadable config"
    });
    // Nothing is overwritten behind the user's back
    expect(mocks.save).not.toHaveBeenCalled();

    await core.functions.aiAccountUiController.resetConfig();

    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(core.states.aiAccountUiController.getMain().isReady).toBe(true);
});
