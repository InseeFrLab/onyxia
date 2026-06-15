import type { ReactNode } from "react";
import { onyxia_import, type OnyxiaImport } from "./onyxia_import";
import { Evt } from "evt";
import { assert } from "tsafe";

export type OnyxiaCtx = {
    import: OnyxiaImport;
    declareComponent: (Component: () => ReactNode) => {
        mount: (containerElement: HTMLElement | null) => void;
    };
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

export const evtDeclaredComponents = Evt.create<
    {
        Component: () => ReactNode;
        containerElement: HTMLElement | null;
    }[]
>([]);

const declareComponent: OnyxiaCtx["declareComponent"] = Component => {
    evtDeclaredComponents.state.push({
        Component,
        containerElement: null
    });

    return {
        mount: containerElement => {
            const declaredComponents = [...evtDeclaredComponents.state];

            const declaredComponent = declaredComponents.find(
                entry => entry.Component === Component
            );

            assert(declaredComponent !== undefined);

            declaredComponent.containerElement = containerElement;

            evtDeclaredComponents.state = declaredComponents;
        }
    };
};
