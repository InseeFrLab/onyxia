import {
    FormFieldGroupComponent,
    FormFieldGroupComponentInner as FormFieldGroupComponentInnerPrivate,
    Props as FormFieldGroupComponentProps
} from "./FormFieldGroupComponent";

export { FormFieldGroupComponent };

export function FormFieldGroupComponentInner(
    props: Omit<
        FormFieldGroupComponentProps,
        "description" | "canAdd" | "helmValuesPath" | "canRemove"
    >
) {
    return (
        <FormFieldGroupComponentInnerPrivate
            {...props}
            canRemove={false}
            helmValuesPath={undefined}
        />
    );
}
