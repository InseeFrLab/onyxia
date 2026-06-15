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

    if (window.onOnyxiaCtxReady !== undefined) {
        window.onOnyxiaCtxReady(onyxiaCtx);
    }

    let value = window.onOnyxiaCtxReady;

    Object.defineProperty(window, "onOnyxiaCtxReady", {
        configurable: false,
        enumerable: true,
        get: () => value,
        set: (value_new: ((onyxiaCtx: OnyxiaCtx) => void) | undefined) => {
            if (value_new !== undefined) {
                value_new(onyxiaCtx);
            }
            value = value_new;
        }
    });
}
