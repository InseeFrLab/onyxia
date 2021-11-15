import type { ThunkAction } from "../setup";
import { Id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { join as pathJoin } from "path";

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

export type ChangeValueParams<K extends keyof ProjectConfigs = keyof ProjectConfigs> = {
    key: K;
    value: ProjectConfigs[K];
};

export const thunks = {
    "changeValue":
        <K extends keyof ProjectConfigs>(params: ChangeValueParams<K>): ThunkAction =>
        async (...args) => {
            const [, getState, { secretsManagerClient }] = args;

            const { getPath } = getPathFactory({
                "projectId": getState().projectSelection.selectedProjectId,
            });

            await secretsManagerClient.put({
                "path": getPath({ "key": params.key }),
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

            const [dispatch, getState, { secretsManagerClient }] = args;

            const { getPath } = getPathFactory({
                "projectId": getState().projectSelection.selectedProjectId,
            });

            const value = await secretsManagerClient
                .get({ "path": getPath({ key }) })
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

export function createGetPathFactory<Key extends string>() {
    function getPathFactory(params: { projectId: string }) {
        const { projectId } = params;

        const getPath = (params: { key: Key }) => {
            const { key } = params;

            return pathJoin(projectId.replace(/^user-/, ""), ".onyxia", key);
        };

        return { getPath };
    }

    return { getPathFactory };
}

const { getPathFactory } = createGetPathFactory<keyof ProjectConfigs>();
