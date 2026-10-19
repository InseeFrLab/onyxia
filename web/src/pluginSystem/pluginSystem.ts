import { onyxia_import, type OnyxiaImport } from "./onyxia_import";
import { declareComponent, type DeclareComponent } from "./declareComponent";

export type OnyxiaCtx = {
    import: OnyxiaImport;
    declareComponent: DeclareComponent;
};

declare global {
    interface Window {
        onOnyxiaCtxReady?: (onyxiaCtx: OnyxiaCtx) => void;
    }
}

export function initPluginSystem() {
    const onyxiaCtx: OnyxiaCtx = {
        import: onyxia_import,
        declareComponent
    };

    const onOnyxiaCtxReady = window.onOnyxiaCtxReady;

    // Consume the startup callback before invoking it. A later plugin may chain
    // the current value, which must not replay plugins that are already running.
    Object.defineProperty(window, "onOnyxiaCtxReady", {
        configurable: false,
        enumerable: true,
        get: () => undefined,
        set: (value_new: ((onyxiaCtx: OnyxiaCtx) => void) | undefined) => {
            if (value_new !== undefined) {
                value_new(onyxiaCtx);
            }
        }
    });

    onOnyxiaCtxReady?.(onyxiaCtx);
}
