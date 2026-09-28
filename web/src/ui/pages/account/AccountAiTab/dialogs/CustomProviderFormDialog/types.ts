import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { CreateDialogView } from "core/usecases/aiProviderFormUiController";

export type ViewProps = {
    view: CreateDialogView.Open;
    onClose: () => void;
    onFieldChange: (key: "name" | "apiBase" | "apiKey", value: string) => void;
    onProviderTypeChange: (providerType: AiConfig.SupportedAiProviderType) => void;
    onTest: () => void;
    onSelectedModelsChange: (models: string[]) => void;
    onSave: () => void;
};
