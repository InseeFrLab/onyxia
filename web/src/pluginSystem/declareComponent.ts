import type { ReactNode } from "react";
import { Evt } from "evt";
import { assert } from "tsafe";

export type DeclareComponent = (Component: () => ReactNode) => {
    mount: (containerElement: HTMLElement | null) => void;
};

type DeclaredComponent = {
    Component: () => ReactNode;
    containerElement: HTMLElement | null;
};

type MountState = {
    containerState: ContainerState;
    portalContainerElement: HTMLElement;
};

type HiddenChildState = {
    display: string;
    displayPriority: string;
    ariaHidden: string | null;
};

type ContainerState = {
    containerElement: HTMLElement;
    declaredComponents: Set<DeclaredComponent>;
    portalContainerElements: Set<HTMLElement>;
    hiddenChildStates: Map<HTMLElement, HiddenChildState>;
    observer: MutationObserver;
};

export const evtDeclaredComponents = Evt.create<DeclaredComponent[]>([]);

const containerStates = new Map<HTMLElement, ContainerState>();
const mountStates = new WeakMap<DeclaredComponent, MountState>();

export const declareComponent: DeclareComponent = Component => {
    const declaredComponent: DeclaredComponent = {
        Component,
        containerElement: null
    };

    evtDeclaredComponents.state.push(declaredComponent);

    return {
        mount: containerElement => {
            unmountDeclaredComponent(declaredComponent);

            if (containerElement === null) {
                setDeclaredComponentContainerElement({
                    declaredComponent,
                    containerElement: null
                });
                return;
            }

            if (!containerElement.isConnected) {
                setDeclaredComponentContainerElement({
                    declaredComponent,
                    containerElement: null
                });
                return;
            }

            const containerState = getOrCreateContainerState(containerElement);
            const portalContainerElement = createPortalContainerElement();

            containerState.declaredComponents.add(declaredComponent);
            containerState.portalContainerElements.add(portalContainerElement);
            mountStates.set(declaredComponent, {
                containerState,
                portalContainerElement
            });

            syncContainerState(containerState);

            setDeclaredComponentContainerElement({
                declaredComponent,
                containerElement: portalContainerElement
            });
        }
    };
};

function createPortalContainerElement() {
    const portalContainerElement = document.createElement("div");

    portalContainerElement.setAttribute("data-onyxia-plugin-portal-container", "");
    portalContainerElement.style.height = "100%";
    portalContainerElement.style.minHeight = "100%";

    return portalContainerElement;
}

function getOrCreateContainerState(containerElement: HTMLElement): ContainerState {
    const existingContainerState = containerStates.get(containerElement);

    if (existingContainerState !== undefined) {
        return existingContainerState;
    }

    const containerState: ContainerState = {
        containerElement,
        declaredComponents: new Set(),
        portalContainerElements: new Set(),
        hiddenChildStates: new Map(),
        observer: new MutationObserver(() => {
            if (!containerElement.isConnected) {
                unmountContainerState(containerState);
                return;
            }

            syncContainerState(containerState);
        })
    };

    containerState.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    containerStates.set(containerElement, containerState);

    return containerState;
}

function syncContainerState(containerState: ContainerState) {
    const { containerElement, portalContainerElements, hiddenChildStates } =
        containerState;

    for (const portalContainerElement of portalContainerElements) {
        if (portalContainerElement.parentElement !== containerElement) {
            containerElement.appendChild(portalContainerElement);
        }

        if (portalContainerElement.nextSibling !== null) {
            containerElement.appendChild(portalContainerElement);
        }
    }

    for (const [child] of hiddenChildStates) {
        if (child.parentElement !== containerElement) {
            hiddenChildStates.delete(child);
        }
    }

    for (const child of Array.from(containerElement.children)) {
        if (!(child instanceof HTMLElement)) {
            continue;
        }

        if (portalContainerElements.has(child)) {
            restoreChild({ child, hiddenChildStates });
            continue;
        }

        hideChild({ child, hiddenChildStates });
    }
}

function hideChild(params: {
    child: HTMLElement;
    hiddenChildStates: Map<HTMLElement, HiddenChildState>;
}) {
    const { child, hiddenChildStates } = params;

    if (!hiddenChildStates.has(child)) {
        hiddenChildStates.set(child, {
            display: child.style.getPropertyValue("display"),
            displayPriority: child.style.getPropertyPriority("display"),
            ariaHidden: child.getAttribute("aria-hidden")
        });
    }

    child.style.setProperty("display", "none", "important");
    child.setAttribute("aria-hidden", "true");
}

function restoreChild(params: {
    child: HTMLElement;
    hiddenChildStates: Map<HTMLElement, HiddenChildState>;
}) {
    const { child, hiddenChildStates } = params;

    const hiddenChildState = hiddenChildStates.get(child);

    if (hiddenChildState === undefined) {
        return;
    }

    child.style.setProperty(
        "display",
        hiddenChildState.display,
        hiddenChildState.displayPriority
    );

    if (hiddenChildState.ariaHidden === null) {
        child.removeAttribute("aria-hidden");
    } else {
        child.setAttribute("aria-hidden", hiddenChildState.ariaHidden);
    }

    hiddenChildStates.delete(child);
}

function restoreContainerChildren(containerState: ContainerState) {
    const { hiddenChildStates } = containerState;

    for (const [child] of Array.from(hiddenChildStates)) {
        restoreChild({ child, hiddenChildStates });
    }
}

function unmountDeclaredComponent(declaredComponent: DeclaredComponent) {
    const mountState = mountStates.get(declaredComponent);

    if (mountState === undefined) {
        return;
    }

    const { containerState, portalContainerElement } = mountState;

    mountStates.delete(declaredComponent);
    containerState.declaredComponents.delete(declaredComponent);
    containerState.portalContainerElements.delete(portalContainerElement);

    portalContainerElement.remove();

    if (containerState.declaredComponents.size === 0) {
        unmountContainerState(containerState);
        return;
    }

    syncContainerState(containerState);
}

function unmountContainerState(containerState: ContainerState) {
    containerState.observer.disconnect();
    containerStates.delete(containerState.containerElement);

    for (const declaredComponent of Array.from(containerState.declaredComponents)) {
        mountStates.delete(declaredComponent);
        setDeclaredComponentContainerElement({
            declaredComponent,
            containerElement: null
        });
    }

    containerState.declaredComponents.clear();

    for (const portalContainerElement of containerState.portalContainerElements) {
        portalContainerElement.remove();
    }

    containerState.portalContainerElements.clear();

    restoreContainerChildren(containerState);
}

function setDeclaredComponentContainerElement(params: {
    declaredComponent: DeclaredComponent;
    containerElement: HTMLElement | null;
}) {
    const { declaredComponent, containerElement } = params;

    assert(evtDeclaredComponents.state.includes(declaredComponent));

    declaredComponent.containerElement = containerElement;

    evtDeclaredComponents.state = [...evtDeclaredComponents.state];
}
