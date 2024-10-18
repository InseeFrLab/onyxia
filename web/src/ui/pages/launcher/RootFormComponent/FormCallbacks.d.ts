import type {
    FormField,
    FormFieldGroup,
    FormFieldValue
} from "core/usecases/launcher/decoupledLogic/formTypes";

export type FormCallbacks = {
    onChange: (params: FormFieldValue) => void;
    onAdd: (params: { helmValuesPath: (string | number)[] }) => void;
    onRemove: (params: { helmValuesPath: (string | number)[]; index: number }) => void;
};
