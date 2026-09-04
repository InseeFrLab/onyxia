import type { CustomProviderProtocol } from "core/usecases/aiCustomProviderFormUiController/decoupledLogic/customProviderProtocol";

export type AiModel = {
    id: string;
    name: string;
};

export type FormValues = {
    name: string;
    protocol: string;
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
    supportedProtocols: readonly CustomProviderProtocol[];
    onClose: () => void;
    onFieldChange: (key: keyof FormValues, value: string) => void;
    onProtocolChange: (protocol: CustomProviderProtocol) => void;
    onTest: () => void;
    onSave: () => void;
    onDoSetAsDefaultChange: (doSetAsDefault: boolean) => void;
};
