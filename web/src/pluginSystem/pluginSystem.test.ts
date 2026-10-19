import { afterEach, describe, expect, it, vi } from "vitest";
import { initPluginSystem, type OnyxiaCtx } from "./pluginSystem";

vi.mock("./onyxia_import", () => ({ onyxia_import: vi.fn() }));
vi.mock("./declareComponent", () => ({ declareComponent: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());

describe("plugin initialization", () => {
    function setup() {
        const window: Pick<Window, "onOnyxiaCtxReady"> = {};
        vi.stubGlobal("window", window);
        return window;
    }

    function registerChainedPlugin(
        window: Pick<Window, "onOnyxiaCtxReady">,
        initialize: (ctx: OnyxiaCtx) => void
    ) {
        const previous = window.onOnyxiaCtxReady;
        window.onOnyxiaCtxReady = ctx => {
            previous?.(ctx);
            initialize(ctx);
        };
    }

    it("initializes plugins registered before the host is ready once", () => {
        const window = setup();
        const first = vi.fn();
        const second = vi.fn();
        registerChainedPlugin(window, first);
        registerChainedPlugin(window, second);

        initPluginSystem();

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        expect(first.mock.calls[0][0]).toBe(second.mock.calls[0][0]);
        expect(window.onOnyxiaCtxReady).toBeUndefined();
    });

    it("does not replay an earlier plugin when the host starts between imports", () => {
        const window = setup();
        const first = vi.fn();
        const second = vi.fn();
        registerChainedPlugin(window, first);

        initPluginSystem();
        registerChainedPlugin(window, second);

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        expect(first.mock.calls[0][0]).toBe(second.mock.calls[0][0]);
    });

    it("initializes each plugin registered after the host is ready once", () => {
        const window = setup();
        const first = vi.fn();
        const second = vi.fn();
        initPluginSystem();

        registerChainedPlugin(window, first);
        registerChainedPlugin(window, second);

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
        expect(window.onOnyxiaCtxReady).toBeUndefined();
    });

    it("clears the startup callback before invoking it", () => {
        const window = setup();
        const nested = vi.fn();
        window.onOnyxiaCtxReady = () => {
            expect(window.onOnyxiaCtxReady).toBeUndefined();
            registerChainedPlugin(window, nested);
        };

        initPluginSystem();

        expect(nested).toHaveBeenCalledOnce();
    });
});
