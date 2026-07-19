import { getCoreSync, useCoreState } from "core";
import { declareComponentKeys } from "i18nifty";
import { memo } from "react";
import { CustomProviderFormDialogView } from "./CustomProviderFormDialog/CustomProviderFormDialogView";

export { CustomProviderFormDialogView } from "./CustomProviderFormDialog/CustomProviderFormDialogView";
export type { ViewProps } from "./CustomProviderFormDialog/types";

export const CustomProviderFormDialog = memo(() => {
    const form = useCoreState("aiCustomProviderFormUiController", "main");

    const {
        functions: { aiCustomProviderFormUiController }
    } = getCoreSync();

    if (!form.isOpen) {
        return null;
    }

    return (
        <CustomProviderFormDialogView
            isEditing={form.isEditing}
            isAlreadyDefault={form.isAlreadyDefault}
            values={form.formValues}
            test={form.connectionTest}
            doSetAsDefault={form.doSetAsDefault}
            canSave={form.canSubmit}
            canTest={form.canTest}
            supportedProtocols={form.supportedProtocols}
            onClose={() => aiCustomProviderFormUiController.close()}
            onFieldChange={(key, value) =>
                aiCustomProviderFormUiController.changeValue({ key, value })
            }
            onProviderChange={provider =>
                aiCustomProviderFormUiController.changeProvider({ provider })
            }
            onTest={() => void aiCustomProviderFormUiController.testConnection()}
            onSave={() => void aiCustomProviderFormUiController.submit()}
            onDoSetAsDefaultChange={doSetAsDefault =>
                aiCustomProviderFormUiController.changeDoSetAsDefault({
                    doSetAsDefault
                })
            }
        />
    );
});

const { i18n } = declareComponentKeys<
    | "add custom provider title"
    | "edit custom provider title"
    | "custom provider section title"
    | "custom provider section subtitle"
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
    | "custom provider model field"
    | "provider test"
    | "provider testing"
    | "provider test success"
    | "provider test error"
    | "set as default provider"
    | "provider save"
    | "provider update"
    | "provider cancel"
    | "close aria label"
>()({ CustomProviderFormDialog });

export type I18n = typeof i18n;
