export type AiModel = {
    id: string;
    name: string;
};

export type FormValues = {
    name: string;
    provider: string;
    apiBase: string;
    apiKey: string;
    selectedModelId: string;
};

export type FormTest =
    | { stateDescription: "idle" }
    | { stateDescription: "testing" }
    | { stateDescription: "success"; models: AiModel[] }
    | { stateDescription: "error" };

export type ViewProps = {
    isEditing: boolean;
    isAlreadyDefault: boolean;
    values: FormValues;
    test: FormTest;
    doSetAsDefault: boolean;
    canSave: boolean;
    canTest: boolean;
    supportedProtocols: readonly string[];
    onClose: () => void;
    onFieldChange: (key: keyof FormValues, value: string) => void;
    onProviderChange: (provider: string) => void;
    onTest: () => void;
    onSave: () => void;
    onDoSetAsDefaultChange: (doSetAsDefault: boolean) => void;
};
