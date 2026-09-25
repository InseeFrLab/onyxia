import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { fetchAiModels, type AiModel } from "core/tools/fetchAiModels";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import type { AiProviderWithRuntime } from "core/usecases/aiProvidersManagements/decoupledLogic";
import { providerTypeDefaultApiBase } from "./decoupledLogic/providerTypeDefaultApiBase";
import { actions, type ChangeValueParams, type State } from "./state";
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
                        providerOrigin: "created by user",
                        formValues: {
                            name: "",
                            providerType: undefined,
                            apiBase: "",
                            apiKey: ""
                        },
                        connectionTest: { stateDescription: "not tested" },
                        excludedModelIds_draft: []
                    })
                );

                return;
            }

            const aiProvider = aiProvidersManagements.selectors
                .aiProviders(getState())
                ?.find(aiProvider => aiProvider.name === providerName);

            assert(aiProvider !== undefined);

            const { apiKeyByProviderName, excludedModelIdsByProviderName } =
                aiProvidersManagements.protectedSelectors.persistedAiConfig(getState());

            dispatch(
                actions.opened({
                    providerName_current: aiProvider.name,
                    providerOrigin: aiProvider.origin,
                    formValues: {
                        name: aiProvider.name,
                        providerType: aiProvider.providerType,
                        apiBase: aiProvider.apiBase,
                        apiKey: apiKeyByProviderName[aiProvider.name] ?? ""
                    },
                    // What we already know from talking to the provider with the saved
                    // configuration, so that the user doesn't have to test it again.
                    connectionTest: getConnectionTestFromRuntime({ aiProvider }),
                    excludedModelIds_draft:
                        excludedModelIdsByProviderName[aiProvider.name] ?? []
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

            assert(
                form.providerOrigin === "created by user" ||
                    (params.key === "apiKey" && form.canEditApiKey),
                "only the API key of a provider configured by the admin can be changed"
            );

            dispatch(actions.formValueChanged(params));
        },
    /** Picking a type prefills the API base with the one of that provider. */
    changeProviderType:
        (params: { providerType: AiConfig.SupportedAiProviderType }) =>
        (...args): void => {
            const { providerType } = params;

            const [dispatch, getState] = args;

            const form = selectors.main(getState());

            if (!form.isOpen || form.isSubmitting) {
                return;
            }

            dispatch(thunks.changeValue({ key: "providerType", value: providerType }));
            dispatch(
                thunks.changeValue({
                    key: "apiBase",
                    value: providerTypeDefaultApiBase[providerType]
                })
            );

            // A provider name is its identifier. Update an automatically suggested
            // name when the protocol changes, without replacing a custom name.
            if (!form.isEditing) {
                const providerNames = new Set(
                    (aiProvidersManagements.selectors.aiProviders(getState()) ?? []).map(
                        aiProvider => aiProvider.name
                    )
                );

                const nameWasSuggested =
                    form.formValues.providerType !== undefined &&
                    form.formValues.name ===
                        getAvailableProviderName({
                            baseName:
                                providerTypeDisplayName[form.formValues.providerType],
                            providerNames
                        });

                if (form.formValues.name.trim() !== "" && !nameWasSuggested) {
                    return;
                }

                dispatch(
                    thunks.changeValue({
                        key: "name",
                        value: getAvailableProviderName({
                            baseName: providerTypeDisplayName[providerType],
                            providerNames
                        })
                    })
                );
            }
        },
    changeSelectedModelIds:
        (params: { selectedModelIds: string[] }) =>
        (...args): void => {
            const { selectedModelIds } = params;

            const [dispatch, getState] = args;

            const form = selectors.main(getState());

            if (!form.isOpen || form.isSubmitting) {
                return;
            }

            const { availableModels } = form;

            assert(
                availableModels !== undefined,
                "models can only be selected once they are known"
            );
            assert(
                selectedModelIds.every(modelId =>
                    availableModels.some(availableModel => availableModel.id === modelId)
                ),
                "a model that the provider doesn't expose can't be selected"
            );

            dispatch(
                actions.excludedModelIdsChanged({
                    excludedModelIds: availableModels
                        .map(({ id }) => id)
                        .filter(modelId => !selectedModelIds.includes(modelId))
                })
            );

            if (!form.isModelSelectionSavedImmediately) {
                return;
            }

            const aiProvider = aiProvidersManagements.selectors
                .aiProviders(getState())
                ?.find(aiProvider => aiProvider.name === form.providerName_current);

            assert(aiProvider !== undefined);

            const { models } = aiProvider;

            assert(models.stateDescription === "loaded");

            dispatch(
                aiProvidersManagements.thunks.setSelectedModelIds({
                    providerName: aiProvider.name,
                    // The provider may list other models since we tested it
                    modelIds: selectedModelIds.filter(modelId =>
                        models.availableModels.some(
                            availableModel => availableModel.id === modelId
                        )
                    )
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

            const { formValues, providerName_current } = form;
            const { providerType } = formValues;

            assert(providerType !== undefined);

            dispatch(actions.connectionTestStarted());

            const connectionTest = await (async (): Promise<
                State.ConnectionTest & {
                    stateDescription: "succeeded" | "failed";
                }
            > => {
                // Nothing the user can type in: the provider is tested with what the
                // admin configured, which doesn't involve any unsaved value.
                if (
                    form.providerOrigin === "configured by admin" &&
                    !form.canEditApiKey
                ) {
                    assert(providerName_current !== undefined);

                    // Obtains the key when needed (token exchange) and calls the provider,
                    // even when its models are pinned
                    await dispatch(
                        aiProvidersManagements.thunks.refreshProvider({
                            providerName: providerName_current
                        })
                    );

                    const aiProvider = aiProvidersManagements.selectors
                        .aiProviders(getState())
                        ?.find(aiProvider => aiProvider.name === providerName_current);

                    assert(aiProvider !== undefined);

                    const connectionTest = getConnectionTestFromRuntime({ aiProvider });

                    return connectionTest.stateDescription === "succeeded"
                        ? connectionTest
                        : { stateDescription: "failed" };
                }

                let availableModels: AiModel[];

                try {
                    availableModels = await fetchAiModels({
                        protocol: providerType,
                        apiBase: formValues.apiBase.trim(),
                        apiKey: formValues.apiKey.trim() || undefined
                    });
                } catch {
                    return { stateDescription: "failed" };
                }

                const aiProvider = aiProvidersManagements.selectors
                    .aiProviders(getState())
                    ?.find(aiProvider => aiProvider.name === providerName_current);

                return {
                    stateDescription: "succeeded",
                    // The admin may have pinned the list of models
                    availableModels:
                        aiProvider?.origin === "configured by admin" &&
                        aiProvider.modelIds !== undefined
                            ? aiProvider.modelIds.map(id => ({ id }))
                            : availableModels
                };
            })();

            const form_now = selectors.main(getState());

            // The user may have kept typing, or closed the form, while we were fetching:
            // a result that no longer describes what is on screen must be dropped.
            if (
                !form_now.isOpen ||
                form_now.providerName_current !== providerName_current ||
                !same(form_now.formValues, formValues)
            ) {
                return;
            }

            dispatch(
                connectionTest.stateDescription === "succeeded"
                    ? actions.connectionTestSucceeded({
                          availableModels: connectionTest.availableModels
                      })
                    : actions.connectionTestFailed()
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

            const { formValues, connectionTest, selectedModelIds_draft } = form;
            const { providerType } = formValues;

            assert(providerType !== undefined);

            dispatch(actions.submissionStarted());

            const providerName = formValues.name.trim();

            const availableModels =
                connectionTest.stateDescription === "succeeded"
                    ? connectionTest.availableModels
                    : undefined;

            try {
                if (form.providerOrigin === "configured by admin") {
                    // Nothing else of such a provider is saved in the user's config
                    if (form.canEditApiKey) {
                        await dispatch(
                            aiProvidersManagements.thunks.setApiKey({
                                providerName,
                                apiKey: formValues.apiKey,
                                availableModels
                            })
                        );
                    }
                } else {
                    await dispatch(
                        aiProvidersManagements.thunks.createOrUpdateUserProvider({
                            providerName_current: form.providerName_current,
                            providerName,
                            providerType,
                            apiBase: formValues.apiBase.trim().replace(/\/+$/, ""),
                            apiKey: formValues.apiKey.trim(),
                            availableModels
                        })
                    );
                }

                // The models can only be selected when they are known. Otherwise the saved
                // exclusions are left as they are.
                if (form.availableModels !== undefined) {
                    dispatch(
                        aiProvidersManagements.thunks.setSelectedModelIds({
                            providerName,
                            modelIds: selectedModelIds_draft
                        })
                    );
                }
            } catch {
                dispatch(actions.submissionFailed());

                return;
            }

            dispatch(actions.submissionSucceeded());
        }
} satisfies Thunks;

const providerTypeDisplayName: Record<AiConfig.SupportedAiProviderType, string> = {
    deepseek: "DeepSeek",
    openai: "OpenAI",
    "openai-compatible": "OpenAI Compatible",
    mistral: "Mistral",
    anthropic: "Anthropic"
};

function getAvailableProviderName(params: {
    baseName: string;
    providerNames: ReadonlySet<string>;
}): string {
    const { baseName, providerNames } = params;

    let suffix = 1;
    let providerName = baseName;

    while (providerNames.has(providerName)) {
        suffix += 1;
        providerName = `${baseName} ${suffix}`;
    }

    return providerName;
}

function getConnectionTestFromRuntime(params: {
    aiProvider: AiProviderWithRuntime;
}): State.ConnectionTest {
    const { aiProvider } = params;

    if (aiProvider.auth.stateDescription === "error") {
        return { stateDescription: "failed" };
    }

    // Whether the provider could be reached, even if its models are pinned
    switch (aiProvider.modelsListing.stateDescription) {
        case "loaded":
            return {
                stateDescription: "succeeded",
                // The models offered: the ones pinned by the admin, if any
                availableModels:
                    aiProvider.models.stateDescription === "loaded"
                        ? aiProvider.models.availableModels
                        : aiProvider.modelsListing.availableModels
            };
        case "error":
            return { stateDescription: "failed" };
        default:
            return { stateDescription: "not tested" };
    }
}
