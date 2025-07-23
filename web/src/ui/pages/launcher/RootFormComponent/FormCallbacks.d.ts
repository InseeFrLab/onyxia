import type {
    FormField,
    FormFieldGroup,
    FormFieldValue
} from "core/usecases/launcher/decoupledLogic/formTypes";

export type FormCallbacks = {
    onChange: (params: {
        formFieldValue: FormFieldValue;
        isAutocompleteSelection: boolean;
    }) => void;
    onAdd: (params: { helmValuesPath: (string | number)[] }) => void;
    onRemove: (params: { helmValuesPath: (string | number)[]; index: number }) => void;
    onFieldErrorChange: (params: {
        helmValuesPath: (string | number)[];
        hasError: boolean;
    }) => void;
    onIsAutoInjectedChange: (params: {
        helmValuesPath: (string | number)[];
        isAutoInjected: boolean;
    }) => void;
    onAutocompletePanelOpen: (params: { helmValuesPath: (string | number)[] }) => void;
};
