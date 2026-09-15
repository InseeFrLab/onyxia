import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";

export type AiModel = {
    id: string;
    name: string;
};

export type FormValues = {
    name: string;
    protocol: string;
    apiBase: string;
    apiKey: string;
};

export type FormTest =
    | { stateDescription: "idle" }
    | { stateDescription: "testing" }
    | { stateDescription: "success"; models: AiModel[] }
    | { stateDescription: "error" };

export type ViewProps = {
    isEditing: boolean;
    hasSubmissionError?: boolean;
    nameIsValid?: boolean;
    apiBaseIsValid?: boolean;
    isSubmitting?: boolean;
    values: FormValues;
    test: FormTest;
    canSave: boolean;
    canTest: boolean;
    supportedProtocols: readonly AiConfig.SupportedAiProviderType[];
    onClose: () => void;
    onFieldChange: (key: keyof FormValues, value: string) => void;
    onProtocolChange: (protocol: AiConfig.SupportedAiProviderType) => void;
    onTest: () => void;
    onSave: () => void;
};
