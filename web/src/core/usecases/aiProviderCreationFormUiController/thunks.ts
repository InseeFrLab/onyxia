import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { fetchAiModels } from "core/tools/fetchAiModels";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import { providerTypeDefaultApiBase } from "./decoupledLogic/providerTypeDefaultApiBase";
import { actions, type ChangeValueParams } from "./state";
import { selectors } from "./selectors";

export const thunks = {
    /** `providerName` undefined opens the form for a provider to be created. */
    open:
        (params: { providerName: string | undefined }) =>
        (...args): void => {
            const { providerName } = params;

            const [dispatch, getState] = args;

            if (providerName === undefined) {
                assert(
                    dispatch(aiProvidersManagements.thunks.canUserCreateProviders()),
                    "the instance configuration doesn't let the user add providers"
                );

                dispatch(
                    actions.opened({
                        providerName_current: undefined,
                        formValues: {
                            name: "",
                            providerType: undefined,
                            apiBase: "",
                            apiKey: ""
                        },
                        connectionTest: { stateDescription: "not tested" }
                    })
                );

                return;
            }

            const aiProvider = aiProvidersManagements.selectors
                .aiProviders(getState())
                ?.find(aiProvider => aiProvider.name === providerName);

            assert(aiProvider !== undefined);
            assert(
                aiProvider.origin === "created by user",
                "only the providers the user created can be edited"
            );

            const { apiKeyByProviderName } =
                aiProvidersManagements.protectedSelectors.persistedAiConfig(getState());

            dispatch(
                actions.opened({
                    providerName_current: aiProvider.name,
                    formValues: {
                        name: aiProvider.name,
                        providerType: aiProvider.providerType,
                        apiBase: aiProvider.apiBase,
                        apiKey: apiKeyByProviderName[aiProvider.name] ?? ""
                    },
                    // We already know the models of a provider that was saved, no need to
                    // make the user test it again just to be allowed to rename it.
                    connectionTest:
                        aiProvider.models.stateDescription === "loaded"
                            ? {
                                  stateDescription: "succeeded",
                                  availableModels: aiProvider.models.availableModels
                              }
                            : { stateDescription: "not tested" }
                })
            );
        },
    close:
        () =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(actions.closed());
        },
    changeValue:
        (params: ChangeValueParams) =>
        (...args): void => {
            const [dispatch, getState] = args;

            const form = selectors.main(getState());

            if (!form.isOpen || form.isSubmitting) {
                return;
            }

            dispatch(actions.formValueChanged(params));
        },
    /** Picking a type prefills the API base with the one of that provider. */
    changeProviderType:
        (params: { providerType: AiConfig.SupportedAiProviderType }) =>
        (...args): void => {
            const { providerType } = params;

            const [dispatch] = args;

            dispatch(thunks.changeValue({ key: "providerType", value: providerType }));
            dispatch(
                thunks.changeValue({
                    key: "apiBase",
                    value: providerTypeDefaultApiBase[providerType]
                })
            );
        },
    testConnection:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            const form = selectors.main(getState());

            if (!form.isOpen || !form.canTestConnection) {
                return;
            }

            const { formValues } = form;
            const { providerType } = formValues;

            assert(providerType !== undefined);

            dispatch(actions.connectionTestStarted());

            const availableModels = await (async () => {
                try {
                    return await fetchAiModels({
                        protocol: providerType,
                        apiBase: formValues.apiBase.trim(),
                        apiKey: formValues.apiKey.trim() || undefined
                    });
                } catch {
                    return undefined;
                }
            })();

            const form_now = selectors.main(getState());

            // The user may have kept typing, or closed the form, while we were fetching:
            // a result that no longer describes what is on screen must be dropped.
            if (!form_now.isOpen || !same(form_now.formValues, formValues)) {
                return;
            }

            dispatch(
                availableModels === undefined
                    ? actions.connectionTestFailed()
                    : actions.connectionTestSucceeded({ availableModels })
            );
        },
    submit:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            const form = selectors.main(getState());

            if (!form.isOpen || !form.canSubmit) {
                return;
            }

            const { formValues, connectionTest } = form;
            const { providerType } = formValues;

            assert(providerType !== undefined);
            assert(connectionTest.stateDescription === "succeeded");

            dispatch(actions.submissionStarted());

            try {
                await dispatch(
                    aiProvidersManagements.thunks.createOrUpdateUserProvider({
                        providerName_current: form.providerName_current,
                        providerName: formValues.name.trim(),
                        providerType,
                        apiBase: formValues.apiBase.trim().replace(/\/+$/, ""),
                        apiKey: formValues.apiKey.trim(),
                        availableModels: connectionTest.availableModels
                    })
                );
            } catch {
                dispatch(actions.submissionFailed());

                return;
            }

            dispatch(actions.submissionSucceeded());
        }
} satisfies Thunks;
