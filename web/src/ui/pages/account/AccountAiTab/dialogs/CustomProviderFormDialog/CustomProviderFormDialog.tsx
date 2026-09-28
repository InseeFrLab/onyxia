import { getCoreSync, useCoreState } from "core";
import { declareComponentKeys } from "i18nifty";
import { memo } from "react";
import { CustomProviderFormDialogView } from "./CustomProviderFormDialogView";

export { CustomProviderFormDialogView } from "./CustomProviderFormDialogView";
export type { ViewProps } from "./types";

/** Only for a provider being created, the existing ones are managed by `ManageProvidersDialog` */
export const CustomProviderFormDialog = memo(() => {
    const view = useCoreState("aiProviderFormUiController", "createDialog");

    const {
        functions: { aiProviderFormUiController: form }
    } = getCoreSync();

    if (!view.isOpen) {
        return null;
    }

    return (
        <CustomProviderFormDialogView
            view={view}
            onClose={form.close}
            onFieldChange={(key, value) => form.changeValue({ key, value })}
            onProviderTypeChange={providerType =>
                form.changeProviderType({ providerType })
            }
            onTest={form.testConnection}
            onSelectedModelsChange={selectedModelIds =>
                form.changeSelectedModelIds({ selectedModelIds })
            }
            onSave={form.submit}
        />
    );
});

const { i18n } = declareComponentKeys<
    | "submission error"
    | "submission error details"
    | "invalid name"
    | "invalid api base"
    | "deepseek provider option"
    | "add custom provider title"
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
    | "provider test error details"
    | "provider save"
    | "provider cancel"
    | "close aria label"
>()({ CustomProviderFormDialog });

export type I18n = typeof i18n;
