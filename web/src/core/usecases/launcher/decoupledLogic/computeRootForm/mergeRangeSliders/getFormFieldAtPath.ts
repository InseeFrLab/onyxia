import type { FormFieldGroup, FormField } from "../../formTypes";
import { assert, type Equals, is } from "tsafe/assert";

type FormFieldLike = {
    type: "field";
};

assert<FormField extends FormFieldLike ? true : false>();

export type FormFieldGroupLike = {
    type: "group";
    nodes: (FormFieldLike | FormFieldGroupLike)[];
};

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function getFormFieldAtPath(params: {
    formFieldGroup: FormFieldGroupLike;
    formFieldPath: number[];
    doExtract: boolean;
}): FormField | FormFieldGroup {
    const { formFieldGroup, formFieldPath, doExtract } = params;

    if (formFieldPath.length === 0) {
        assert(!doExtract);
        assert<Equals<typeof formFieldGroup, FormFieldGroupLike>>();
        assert(is<FormFieldGroup>(formFieldGroup));
        return formFieldGroup;
    }

    return getFormFieldAtPath_rec({
        formFieldGroup,
        formFieldPath,
        doExtract
    });
}

export function getFormFieldAtPath_rec(params: {
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

        const formField = formFieldGroup.nodes[i];

        if (doExtract) {
            formFieldGroup.nodes.splice(i, 1);
        }

        // NOTE: Avoid introducing too much generic typing here just to make the function easier to test.
        assert<Equals<typeof formField, FormFieldLike | FormFieldGroupLike>>();
        assert(is<FormField | FormFieldGroup>(formField));
        return formField;
    }

    const [i, ...rest] = formFieldPath;

    const formFieldGroup_i = formFieldGroup.nodes[i];

    assert(formFieldGroup_i.type === "group");

    return getFormFieldAtPath_rec({
        formFieldGroup: formFieldGroup_i,
        formFieldPath: rest,
        doExtract
    });
}
