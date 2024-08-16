import type { FormFieldGroup, FormField } from "../../../formTypes";
import { assert } from "tsafe/assert";

export function getFormFieldAtPath(params: {
    formFieldGroup: FormFieldGroup;
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

        assert(formField.type === "field");

        if (doExtract) {
            formFieldGroup.children.splice(i, 1);
        }

        return formField;
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
