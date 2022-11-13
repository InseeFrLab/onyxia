import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import * as minio from "js/minio-client/minio-tools";
import { PUSHER } from "js/components/notifications";
import type { ThunkAction } from "core/setup";
import { thunks as userAuthentication } from "core/usecases/userAuthentication";

export type State = {
    currentObjects: (Blob & { name: string })[];
    currentDirectories: { prefix: string }[];
    /** bucket -> policy */
    bucketsPolicies: Record<string, State.Policy>;
    userBuckets: State.Bucket[] | undefined;
};

export declare namespace State {
    export type Policy = {
        Version: string;
        Statement: never[];
    };

    export type Bucket = {
        id: string;
        description: string;
        isPublic: boolean;
    };
}

export const name = "myFiles";

export const asyncThunks = {
    ...(() => {
        const typePrefix = "loadBucketContent";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (
                    payload: {
                        bucketName: string;
                        prefix: string;
                        rec: boolean;
                    },
                    { dispatch },
                ) => {
                    const { bucketName, prefix, rec } = payload;

                    assert(
                        typeof bucketName === "string" &&
                            typeof prefix === "string" &&
                            typeof rec === "boolean",
                    );

                    dispatch(actions.emptyCurrentBucket());

                    // eslint-disable-next-line
                    walkGetUserBucketPolicy: {
                        const policy = await minio
                            .getBucketPolicy(bucketName)
                            .catch(() => undefined);

                        if (policy === undefined) {
                            // eslint-disable-next-line
                            break walkGetUserBucketPolicy;
                        }

                        dispatch(
                            actions.setBucketPolicy({
                                "bucket": bucketName,
                                "policy": JSON.parse(policy),
                            }),
                        );
                    }

                    const stream = await minio.getBucketContent(
                        bucketName,
                        prefix.replace(/^\//, ""),
                        rec,
                    );

                    stream.on("data", object =>
                        dispatch(
                            "prefix" in object
                                ? actions.addDirectoryToCurrentBucket({
                                      "directory": object as any,
                                  }) //TODO
                                : actions.addObjectToCurrentBucket({
                                      "object": object as any,
                                  }),
                        ),
                    );

                    stream.on(
                        "error",
                        (error: { resource: string }) =>
                            PUSHER.push(`Accés refusé : ${error.resource}`), //TODO: Franglish
                    );
                },
            ),
        };
    })(),
    ...(() => {
        const typePrefix = "uploadFileToBucket";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (payload: {
                    file: Blob & { name: string };
                    bucketName: string;
                    notify: (msg: string, params: Blob) => void;
                    path: string;
                }) => {
                    //TODO: Figure out why there is no dispatch.
                    //TODO: Franglish

                    const { file, bucketName, notify, path } = payload;

                    assert(
                        typeof file === "object" &&
                            typeof bucketName === "string" &&
                            typeof notify === "function" &&
                            typeof path === "string",
                    );

                    const result = await minio
                        .uploadFile({ bucketName, file, notify, path })
                        .catch(() => undefined);

                    if (!result) {
                        PUSHER.push(`l'upload du fichier ${file.name} a échoué.`);
                        return;
                    }

                    PUSHER.push(`${file.name} a été uploadé.`);
                },
            ),
        };
    })(),
    ...(() => {
        const typePrefix = "removeObjectFromBucket";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (payload: { bucketName: string; objectName: string }) => {
                    //TODO: Figure out why there is no dispatch.
                    //TODO: Franglish

                    const { bucketName, objectName } = payload;

                    assert(
                        typeof bucketName === "string" && typeof objectName === "string",
                    );

                    const result = await minio
                        .removeObject({ bucketName, objectName })
                        .catch(() => undefined);

                    if (!result) {
                        PUSHER.push(`la suppression du fichier ${objectName} a échoué.`);
                        return;
                    }

                    PUSHER.push(`${objectName} a été supprimé.`);
                },
            ),
        };
    })(),
    "loadUserBuckets":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch] = args;

            const { username, groups } = dispatch(userAuthentication.getUser());

            dispatch(
                actions.loadUserBuckets({
                    "buckets": [username, ...(groups ?? []).map(g => `projet-${g}`)].map(
                        (id, i) => ({
                            id,
                            "description": i === 0 ? "bucket personnel" : "", //TODO: Franglish
                            "isPublic": false,
                        }),
                    ),
                }),
            );
        },
};

const slice = createSlice({
    name,
    "initialState": id<State>({
        "currentObjects": [],
        "currentDirectories": [],
        "bucketsPolicies": {},
        "userBuckets": undefined,
    }),
    "reducers": {
        "loadUserBuckets": (
            state,
            { payload }: PayloadAction<{ buckets: State.Bucket[] }>,
        ) => {
            const { buckets } = payload;

            state.userBuckets = buckets;
        },
        "emptyCurrentBucket": state => {
            state.currentObjects = [];
            state.currentDirectories = [];
        },
        "addObjectToCurrentBucket": (
            state,
            { payload }: PayloadAction<{ object: State["currentObjects"][number] }>,
        ) => {
            const { object } = payload;

            assert(typeof object === "object");

            state.currentObjects.push(object);
        },
        "addDirectoryToCurrentBucket": (
            state,
            {
                payload,
            }: PayloadAction<{
                directory: State["currentDirectories"][number];
            }>,
        ) => {
            const { directory } = payload;

            state.currentDirectories.push(directory);
        },
        "setBucketPolicy": (
            state,
            {
                payload,
            }: PayloadAction<{
                bucket: keyof State["bucketsPolicies"];
                policy: State["bucketsPolicies"][string];
            }>,
        ) => {
            const { bucket, policy } = payload;

            assert(typeof bucket === "string" && typeof policy === "object");

            state.bucketsPolicies[bucket] = policy;
        },
    },
});

export const { actions } = slice;

export const thunks = {};

export const reducer = slice.reducer;
