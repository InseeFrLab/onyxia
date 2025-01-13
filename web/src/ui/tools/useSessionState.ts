import { useState } from "react";
import type { Stringifyable } from "core/tools/Stringifyable";
import { useConstCallback } from "powerhooks/useConstCallback";

export function useSessionState<T extends Stringifyable>(params: {
    stateUniqueId: string;
    zState: { parse: (data: any) => T };
    initialValue: T | (() => T);
}): [T, (newValue: T) => void] {
    const { initialValue, stateUniqueId, zState } = params;

    const [state, setState_base] = useState(() => {
        from_storage: {
            const storedState = getStoredState<T>({ stateUniqueId, zState });

            if (storedState === undefined) {
                break from_storage;
            }

            return storedState;
        }

        if (typeof initialValue === "function") {
            return initialValue();
        }

        return initialValue;
    });

    const setState = useConstCallback((newValue: T) => {
        setState_base(newValue);
        storeState(stateUniqueId, newValue);
    });

    return [state, setState] as const;
}

const SESSION_STORAGE_PREFIX = "useSessionState:";

function getStoredState<T extends Stringifyable>(params: {
    stateUniqueId: string;
    zState: { parse: (data: any) => T };
}): T | undefined {
    const { stateUniqueId, zState } = params;

    const stateStr = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${stateUniqueId}`);

    if (stateStr === null) {
        return undefined;
    }

    let state: unknown;

    try {
        state = JSON.parse(stateStr);
    } catch {
        return undefined;
    }

    try {
        return zState.parse(state);
    } catch {
        return undefined;
    }
}

function storeState<T extends Stringifyable>(stateUniqueId: string, state: T): void {
    sessionStorage.setItem(
        `${SESSION_STORAGE_PREFIX}${stateUniqueId}`,
        JSON.stringify(state)
    );
}
