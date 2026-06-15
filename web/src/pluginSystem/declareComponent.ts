import type { ReactNode } from "react";
import { Evt } from "evt";
import { assert } from "tsafe";

export type DeclareComponent = (Component: () => ReactNode) => {
    mount: (containerElement: HTMLElement | null) => void;
};

export const evtDeclaredComponents = Evt.create<
    {
        Component: () => ReactNode;
        containerElement: HTMLElement | null;
    }[]
>([]);

export const declareComponent: DeclareComponent = Component => {
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
