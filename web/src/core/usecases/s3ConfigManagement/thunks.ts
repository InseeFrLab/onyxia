import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import structuredClone from "@ungap/structured-clone";
import { assert } from "tsafe/assert";

export const thunks = {
    "deleteCustomS3Config":
        (params: { customConfigIndex: number }) =>
        async (...args) => {
            const { customConfigIndex } = params;

            const [dispatch, getState] = args;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            assert(s3.customConfigs[customConfigIndex] !== undefined);

            if (s3.indexForExplorer === customConfigIndex) {
                s3.indexForExplorer = undefined;
            }

            if (s3.indexForXOnyxia === customConfigIndex) {
                s3.indexForXOnyxia = undefined;
            }

            s3.customConfigs.splice(customConfigIndex, 1);

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        },
    "setConfigUsage":
        (params: {
            customConfigIndex: number | undefined;
            usedFor: "xOnyxia" | "explorer";
            isUsed: boolean;
        }) =>
        async (...args) => {
            const { customConfigIndex, usedFor, isUsed } = params;

            const [dispatch, getState] = args;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            if (customConfigIndex === undefined) {
                assert(isUsed, "The switch should be disabled");

                switch (usedFor) {
                    case "explorer":
                        s3.indexForExplorer = undefined;
                        break;
                    case "xOnyxia":
                        s3.indexForXOnyxia = undefined;
                        break;
                }
            } else {
                assert(s3.customConfigs[customConfigIndex] !== undefined);

                const index = isUsed ? customConfigIndex : undefined;

                switch (usedFor) {
                    case "explorer":
                        s3.indexForExplorer = index;
                        break;
                    case "xOnyxia":
                        s3.indexForXOnyxia = index;
                        break;
                }
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    "addCustomS3Config":
        (params: {
            customS3Config: projectManagement.ProjectConfigs.CustomS3Config & {
                isUsedForXOnyxia: boolean;
                isUsedForExplorer: boolean;
            };
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const {
                customS3Config: { isUsedForXOnyxia, isUsedForExplorer, ...customS3Config }
            } = params;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            s3.customConfigs.push({
                ...customS3Config,
                "workingDirectoryPath": customS3Config.workingDirectoryPath
            });

            {
                const newIndex = s3.customConfigs.length - 1;

                if (isUsedForXOnyxia) {
                    s3.indexForXOnyxia = newIndex;
                }

                if (isUsedForExplorer) {
                    s3.indexForExplorer = newIndex;
                }
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        },
    "testConnection":
        (params: { customS3Config: projectManagement.ProjectConfigs.CustomS3Config }) =>
        async (): Promise<
            | {
                  isSuccess: true;
              }
            | {
                  isSuccess: false;
                  error: string;
              }
        > => {
            const { customS3Config } = params;

            const { createS3Client } = await import("core/adapters/s3Client/default");

            const s3Client = createS3Client({
                "url": customS3Config.url,
                "pathStyleAccess": customS3Config.pathStyleAccess,
                "isStsEnabled": false,
                "region": customS3Config.region,
                "accessKeyId": customS3Config.accessKeyId,
                "secretAccessKey": customS3Config.secretAccessKey,
                "sessionToken": customS3Config.sessionToken
            });

            try {
                await s3Client.list({
                    "path": customS3Config.workingDirectoryPath
                });
            } catch (error) {
                return {
                    "isSuccess": false,
                    "error": String(error)
                };
            }

            return {
                "isSuccess": true
            };
        }
} satisfies Thunks;
