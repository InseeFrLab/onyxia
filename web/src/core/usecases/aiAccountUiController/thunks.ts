import type { Thunks } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import { parseModel } from "core/usecases/aiProvidersManagements/decoupledLogic";
import { assert } from "tsafe/assert";

export const thunks = {
    /** Whether the AI tab has to be shown at all. */
    isAvailable:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(aiProvidersManagements.thunks.isAvailable());
        },
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(aiProvidersManagements.thunks.load());
        },
    /** Only when the stored config can't be read back: everything it held is lost. */
    resetConfig:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(aiProvidersManagements.thunks.resetConfig());
        },
    canUserCreateProviders:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(aiProvidersManagements.thunks.canUserCreateProviders());
        },
    setSelectedModelIds:
        (params: { providerName: string; modelIds: string[] }) =>
        (...[dispatch]) => {
            dispatch(aiProvidersManagements.thunks.setSelectedModelIds(params));
        },
    retrySave:
        () =>
        (...[dispatch]) => {
            dispatch(aiProvidersManagements.thunks.saveConfig());
        },
    /** `model` is the `<providerName>/<modelId>` value of the global select. */
    setDefaultModel:
        (params: { model: string | undefined }) =>
        (...[dispatch]) => {
            const { model } = params;
            const defaultModel = model === undefined ? undefined : parseModel({ model });
            assert(model === undefined || defaultModel !== undefined);
            dispatch(aiProvidersManagements.thunks.setDefaultModel({ defaultModel }));
        }
} satisfies Thunks;
