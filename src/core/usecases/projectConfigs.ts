import type { ThunkAction } from "../setup";
import { Id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { join as pathJoin } from "path";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { hiddenDirectoryBasename } from "./userConfigs";

/*
Here no state because other project user may have changed 
the values here at any time. Unlike in userConfigs we
can't assume that the values haven't changed since last fetch.
We expose a non-reactive API to force the UI dev to take 
that into account.
*/

export type ProjectConfigs = Id<
    Record<string, string | boolean | number | null>,
    {
        servicePassword: string;
    }
>;

function getDefault<K extends keyof ProjectConfigs>(key: K): ProjectConfigs[K] {
    switch (key) {
        case "servicePassword":
            return Array(2)
                .fill("")
                .map(() => Math.random().toString(36).slice(-10))
                .join("")
                .replace(/\./g, "");
    }

    assert(false);
}

export const name = "projectConfigs";

export const reducer = null;

export type ChangeValueParams<K extends keyof ProjectConfigs = keyof ProjectConfigs> = {
    key: K;
    value: ProjectConfigs[K];
};

export const thunks = {
    "changeValue":
        <K extends keyof ProjectConfigs>(params: ChangeValueParams<K>): ThunkAction =>
        async (...args) => {
            const [dispatch, , { secretsManagerClient }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            await secretsManagerClient.put({
                "path": pathJoin(dirPath, params.key),
                "secret": { "value": params.value },
            });
        },
    "renewServicePassword": (): ThunkAction => dispatch =>
        dispatch(
            thunks.changeValue({
                "key": "servicePassword",
                "value": getDefault("servicePassword"),
            }),
        ),
    "getValue":
        <K extends keyof ProjectConfigs>(params: {
            key: K;
        }): ThunkAction<Promise<ProjectConfigs[K]>> =>
        async (...args) => {
            const { key } = params;

            const [dispatch, , { secretsManagerClient }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            const value = await secretsManagerClient
                .get({ "path": pathJoin(dirPath, key) })
                .then(({ secret }) => secret["value"] as ProjectConfigs[K])
                .catch(() => undefined);

            if (value === undefined) {
                const value = getDefault(key);

                await dispatch(
                    thunks.changeValue({
                        key,
                        value,
                    }),
                );

                return value;
            }

            return value;
        },
};

const privateThunks = {
    "getDirPath":
        (): ThunkAction<string> =>
        (...args) => {
            const [, getState] = args;

            const project = projectSelectionSelectors.selectedProject(getState());

            return pathJoin("/", project.vaultTopDir, hiddenDirectoryBasename);
        },
};
