import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
});

const isReady = createSelector(state, state => state.stateDescription === "ready");

const helmReleaseName = createSelector(state, state => {
    if (state.stateDescription === "not initialized" && !state.isFetching) {
        return undefined;
    }

    const { helmReleaseName } = state;

    return helmReleaseName;
});

const helmReleaseFriendlyName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { helmReleaseFriendlyName } = state;

    return helmReleaseFriendlyName;
});

const tasks = createSelector(readyState, state => {
    if (state === undefined) {
        return [];
    }

    return state.tasks;
});

const events = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { events } = state;

    return events;
});

const env = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { env } = state;

    return env;
});

const main = createSelector(
    isReady,
    helmReleaseName,
    helmReleaseFriendlyName,
    tasks,
    events,
    env,
    (isReady, helmReleaseName, helmReleaseFriendlyName, tasks, events, env) => {
        if (!isReady) {
            return {
                "isReady": false as const,
                helmReleaseName
            };
        }

        assert(helmReleaseName !== undefined);
        assert(helmReleaseFriendlyName !== undefined);
        assert(tasks !== undefined);
        assert(events !== undefined);
        assert(env !== undefined);

        return {
            "isReady": true,
            helmReleaseName,
            helmReleaseFriendlyName,
            tasks,
            events,
            env
        };
    }
);

export const selectors = {
    main
};
