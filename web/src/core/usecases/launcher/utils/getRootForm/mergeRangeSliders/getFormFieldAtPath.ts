import type { FormFieldGroup, FormField } from "../../../formTypes";
import { assert, type Equals } from "tsafe/assert";

type FormFieldLike = {
    type: "field";
};

assert<FormField extends FormFieldLike ? true : false>();

export type FormFieldGroupLike = {
    type: "group";
    children: (FormFieldLike | FormFieldGroupLike)[];
};

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function getFormFieldAtPath(params: {
    formFieldGroup: FormFieldGroupLike;
    formFieldPath: number[];
    doExtract: boolean;
}): FormField | FormFieldGroup {
    const { formFieldGroup, formFieldPath, doExtract } = params;

    exit_case: {
        if (formFieldPath.length !== 1) {
            break exit_case;
        }

        const [i] = formFieldPath;

        const formField = formFieldGroup.children[i];

        if (doExtract) {
            formFieldGroup.children.splice(i, 1);
        }

        // NOTE: Avoid introducing too much generic typing here just to make the function easier to test.
        assert<Equals<typeof formField, FormFieldLike | FormFieldGroupLike>>();
        return formField as any;
    }

    const [i, ...rest] = formFieldPath;

    const formFieldGroup_i = formFieldGroup.children[i];

    assert(formFieldGroup_i.type === "group");

    return getFormFieldAtPath({
        "formFieldGroup": formFieldGroup_i,
        "formFieldPath": rest,
        doExtract
    });
}
