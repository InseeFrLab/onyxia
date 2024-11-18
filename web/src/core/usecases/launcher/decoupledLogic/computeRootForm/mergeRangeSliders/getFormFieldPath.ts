import type { FormFieldGroup, FormField } from "../../formTypes";
import { exclude } from "tsafe/exclude";
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

export function getFormFieldPath(params: {
    formFieldGroup: FormFieldGroupLike;
    predicate: (formField: FormField) => boolean;
}): number[] | undefined {
    const { formFieldGroup, predicate } = params;

    return getFormFieldPath_rec({
        formFieldGroup,
        predicate,
        formFieldPath: []
    });
}

function getFormFieldPath_rec(params: {
    formFieldPath: number[];
    formFieldGroup: FormFieldGroupLike;
    predicate: (formField: FormField) => boolean;
}): number[] | undefined {
    const { formFieldPath, formFieldGroup, predicate } = params;

    {
        const i = formFieldGroup.nodes.findIndex(node => {
            if (node.type !== "field") {
                return false;
            }

            // NOTE: We don't want to go into too much generic typing here just to make the function
            // easier to write unit test for, this is plenty safe enough.
            assert<Equals<typeof node, FormFieldLike>>();
            assert(is<FormField>(node));
            return predicate(node);
        });

        if (i !== -1) {
            return [...formFieldPath, i];
        }
    }

    for (const [formFieldGroup_i, i] of formFieldGroup.nodes
        .map((node, index) => {
            if (node.type === "field") {
                return undefined;
            }

            return [node, index] as const;
        })
        .filter(exclude(undefined))) {
        const formFieldPath_next = getFormFieldPath_rec({
            formFieldGroup: formFieldGroup_i,
            formFieldPath: [...formFieldPath, i],
            predicate
        });

        if (formFieldPath_next !== undefined) {
            return formFieldPath_next;
        }
    }

    return undefined;
}
