import { describe, expect, it, vi } from "vitest";
import { createCore } from "clean-architecture";
import type { Context } from "core/bootstrap";
import type { AiGateway } from "core/ports/AiGateway";
import { actions, name, reducer } from "core/usecases/ai/state";
import { selectors } from "core/usecases/ai/selectors";
import { thunks, protectedThunks } from "core/usecases/ai/thunks";
import { createEvt } from "core/usecases/ai/evt";

const userConfigsMock = vi.hoisted(() => ({ aiConfigStr: null as string | null }));

vi.mock("core/usecases/userConfigs", () => ({
    selectors: {
        userConfigs: () => ({ aiConfigStr: userConfigsMock.aiConfigStr })
    },
    thunks: {}
}));

const ai = {
    name,
    reducer,
    actions,
    selectors,
    thunks,
    protectedThunks,
    createEvt
} as const;

function initializeAi(params: { aiConfigStr: string | null; aiGateways?: AiGateway[] }) {
    const { aiConfigStr, aiGateways = [] } = params;

    userConfigsMock.aiConfigStr = aiConfigStr;

    const context = { aiGateways } as Context;

    const { core, dispatch } = createCore({
        context,
        usecases: { ai }
    });

    return {
        core,
        prInitialized: (dispatch as any)(ai.protectedThunks.initialize()) as Promise<void>
    };
}

describe("AI initialization errors", () => {
    it("reports a saved configuration that cannot be restored", async () => {
        const { core, prInitialized } = initializeAi({
            aiConfigStr: "{not valid JSON"
        });

        await prInitialized;

        let eventReceived: unknown;
        core.evts.evtAi.attach(event => (eventReceived = event));

        expect(eventReceived).toStrictEqual({
            action: "display error",
            error: { kind: "config-restoration-failed" }
        });
        expect(core.states.ai.getMain().stateDescription).toBe("initialized");
    });

    it("reports a missing managed-provider account", async () => {
        const aiGateway: AiGateway = {
            id: "open-webui",
            name: "OpenWebUI",
            protocol: "openai",
            description: undefined,
            accountCreation: undefined,
            webUiUrl: "https://openwebui.example.com",
            apiBase: "https://openwebui.example.com/api",
            getAccessToken: async () => ({
                stateDescription: "no account"
            }),
            listModels: async () => []
        };

        const { core, prInitialized } = initializeAi({
            aiConfigStr: null,
            aiGateways: [aiGateway]
        });

        await prInitialized;

        let eventReceived: unknown;
        core.evts.evtAi.attach(event => (eventReceived = event));

        expect(eventReceived).toStrictEqual({
            action: "display error",
            error: {
                kind: "no-account",
                providerName: "OpenWebUI",
                webUiUrl: "https://openwebui.example.com"
            }
        });
    });
});
