import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import structuredClone from "@ungap/structured-clone";
import { assert } from "tsafe/assert";
import { actions, type ConnectionTestStatus } from "./state";
import { testS3CustomConfigConnection } from "./utils/testS3CustomConfigConnection";

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

            dispatch(
                actions.customConfigDeleted({
                    customConfigIndex
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
        },
    "testConnection":
        (params: { customConfigIndex: number }) =>
        async (...args) => {
            const { customConfigIndex } = params;

            const [dispatch, getState] = args;

            dispatch(
                actions.connectionTestStarted({
                    customConfigIndex
                })
            );

            const { customConfigs } =
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3;

            const customS3Config = customConfigs[customConfigIndex];

            assert(customS3Config !== undefined);

            const result = await testS3CustomConfigConnection({
                customS3Config
            });

            if (result.isSuccess) {
                dispatch(
                    actions.connectionTestSucceeded({
                        customConfigIndex
                    })
                );
            } else {
                dispatch(
                    actions.connectionTestFailed({
                        customConfigIndex,
                        "errorMessage": result.error
                    })
                );
            }
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            evtAction
                .pipe(
                    action =>
                        action.usecaseName === "projectManagement" &&
                        action.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => {
                    const { customConfigs } =
                        projectManagement.protectedSelectors.currentProjectConfigs(
                            getState()
                        ).s3;

                    dispatch(
                        actions.initialized({
                            "customConfigCount": customConfigs.length
                        })
                    );
                });
        },
    "addOrUpdateCustomS3Config":
        (params: {
            customS3Config: projectManagement.ProjectConfigs.CustomS3Config;
            customConfigIndex: number | undefined;
            connectionTestStatus: ConnectionTestStatus;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { customS3Config, customConfigIndex, connectionTestStatus } = params;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            if (customConfigIndex !== undefined) {
                dispatch(
                    actions.customConfigUpdated({
                        customConfigIndex,
                        connectionTestStatus
                    })
                );

                s3.customConfigs[customConfigIndex] = customS3Config;
            } else {
                dispatch(
                    actions.customConfigAdded({
                        connectionTestStatus
                    })
                );

                s3.customConfigs.push(customS3Config);
            }

            enable_for_explorer_and_or_xOnyxia_if_pertinent_and_creation: {
                if (customConfigIndex !== undefined) {
                    break enable_for_explorer_and_or_xOnyxia_if_pertinent_and_creation;
                }

                const {
                    shouldNewConfigBeUsedForExplorer,
                    shouldNewConfigBeUsedForXOnyxia
                } = (() => {
                    const isStsEnabled =
                        deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        ).s3?.sts !== undefined;

                    if (isStsEnabled) {
                        return {
                            "shouldNewConfigBeUsedForXOnyxia": false,
                            "shouldNewConfigBeUsedForExplorer": false
                        };
                    }

                    const { indexForExplorer, indexForXOnyxia } = s3;

                    return {
                        "shouldNewConfigBeUsedForXOnyxia": indexForXOnyxia === undefined,
                        "shouldNewConfigBeUsedForExplorer": indexForExplorer === undefined
                    };
                })();

                const newIndex = s3.customConfigs.length - 1;

                if (shouldNewConfigBeUsedForXOnyxia) {
                    s3.indexForXOnyxia = newIndex;
                }

                if (shouldNewConfigBeUsedForExplorer) {
                    s3.indexForExplorer = newIndex;
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
