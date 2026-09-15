import type { Thunks } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import { parseModel } from "core/usecases/aiProvidersManagements";
import { assert } from "tsafe/assert";
import { actions, name } from "./state";

export const thunks = {
    /** Whether the AI tab has to be shown at all. */
    isAvailable:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(aiProvidersManagements.thunks.isAvailable());
        },
    /** The tab shows a loader until this settles, nothing is loaded at bootstrap. */
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(aiProvidersManagements.thunks.load());
        },
    canUserCreateProviders:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(aiProvidersManagements.thunks.canUserCreateProviders());
        },
    refreshToken:
        (params: { providerName: string }) =>
        async (...[dispatch]): Promise<void> => {
            await dispatch(
                privateThunks.runProviderOperation({
                    providerName: params.providerName,
                    mutate: () =>
                        dispatch(aiProvidersManagements.thunks.refreshToken(params))
                })
            );
        },
    logInToProvider:
        (params: { providerName: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(
                privateThunks.runProviderOperation({
                    providerName: params.providerName,
                    mutate: () =>
                        dispatch(aiProvidersManagements.thunks.logInToProvider(params))
                })
            );
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
    setApiKey:
        (params: { providerName: string; apiKey: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(
                privateThunks.runProviderOperation({
                    providerName: params.providerName,
                    mutate: () =>
                        dispatch(aiProvidersManagements.thunks.setApiKey(params))
                })
            );
        },
    deleteUserProvider:
        (params: { providerName: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(
                privateThunks.runProviderOperation({
                    providerName: params.providerName,
                    mutate: () =>
                        dispatch(aiProvidersManagements.thunks.deleteUserProvider(params))
                })
            );
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

const privateThunks = {
    runProviderOperation:
        (params: { providerName: string; mutate: () => Promise<void> }) =>
        async (...args): Promise<void> => {
            const { providerName, mutate } = params;

            const [dispatch, getState] = args;

            if (getState()[name].operationByProviderName[providerName] === "pending") {
                return;
            }

            dispatch(actions.providerOperationStarted({ providerName }));

            try {
                await mutate();
            } catch {
                dispatch(
                    actions.providerOperationCompleted({ providerName, isSuccess: false })
                );

                return;
            }

            dispatch(
                actions.providerOperationCompleted({ providerName, isSuccess: true })
            );
        }
} satisfies Thunks;
