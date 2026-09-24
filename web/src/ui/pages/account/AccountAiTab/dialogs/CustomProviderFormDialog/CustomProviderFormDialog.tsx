import { getCoreSync, useCoreState } from "core";
import { declareComponentKeys } from "i18nifty";
import { memo } from "react";
import { CustomProviderFormDialogView } from "./CustomProviderFormDialogView";

export { CustomProviderFormDialogView } from "./CustomProviderFormDialogView";
export type { ViewProps } from "./types";

export const CustomProviderFormDialog = memo(() => {
    const form = useCoreState("aiProviderFormUiController", "main");

    const {
        functions: { aiProviderFormUiController }
    } = getCoreSync();

    // Existing providers, whatever their origin, are managed by `ManageProvidersDialog`
    if (!form.isOpen || form.isEditing) {
        return null;
    }

    return (
        <CustomProviderFormDialogView
            isEditing={form.isEditing}
            values={{ ...form.formValues, protocol: form.formValues.providerType ?? "" }}
            test={
                form.connectionTest.stateDescription === "succeeded"
                    ? {
                          stateDescription: "success",
                          models: form.connectionTest.availableModels
                      }
                    : {
                          stateDescription:
                              form.connectionTest.stateDescription === "not tested"
                                  ? "idle"
                                  : form.connectionTest.stateDescription === "failed"
                                    ? "error"
                                    : "testing"
                      }
            }
            selectedModels={form.selectedModelIds_draft}
            canSave={form.canSubmit}
            canTest={form.canTestConnection}
            supportedProtocols={form.supportedProviderTypes}
            onClose={() => aiProviderFormUiController.close()}
            onFieldChange={(key, value) => {
                if (key !== "protocol")
                    aiProviderFormUiController.changeValue({ key, value });
            }}
            onProtocolChange={protocol =>
                aiProviderFormUiController.changeProviderType({
                    providerType: protocol
                })
            }
            onTest={() => aiProviderFormUiController.testConnection()}
            onSelectedModelsChange={selectedModelIds =>
                aiProviderFormUiController.changeSelectedModelIds({
                    selectedModelIds
                })
            }
            onSave={() => aiProviderFormUiController.submit()}
            hasSubmissionError={form.hasSubmissionFailed}
            nameIsValid={form.isNameValid}
            apiBaseIsValid={form.isApiBaseValid}
            isSubmitting={form.isSubmitting}
        />
    );
});

const { i18n } = declareComponentKeys<
    | "submission error"
    | "invalid name"
    | "invalid api base"
    | "deepseek provider option"
    | "add custom provider title"
    | "edit custom provider title"
    | "custom provider section title"
    | "custom provider label field"
    | "custom provider type field"
    | "openai provider option"
    | "openai compatible provider option"
    | "mistral provider option"
    | "anthropic provider option"
    | "credentials section title"
    | "credentials section subtitle"
    | "custom provider api base field"
    | "custom provider api key field"
    | "verification section title"
    | "verification section subtitle"
    | "provider test"
    | "provider testing"
    | "provider test success"
    | "provider test error"
    | "provider save"
    | "provider update"
    | "provider cancel"
    | "close aria label"
>()({ CustomProviderFormDialog });

export type I18n = typeof i18n;
