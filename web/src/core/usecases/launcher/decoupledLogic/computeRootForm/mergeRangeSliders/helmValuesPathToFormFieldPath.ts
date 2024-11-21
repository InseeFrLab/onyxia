import type { FormFieldGroup, FormField } from "../../formTypes";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

type FormFieldLike = {
    type: "field";
};

assert<FormField extends FormFieldLike ? true : false>();

export type FormFieldGroupLike = {
    type: "group";
    helmValuesPath: (string | number)[];
    nodes: (FormFieldLike | FormFieldGroupLike)[];
};

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function helmValuesPathToFormFieldPath(params: {
    helmValuesPathToGroup: (string | number)[];
    formFieldGroup: FormFieldGroupLike;
}): number[] {
    const { helmValuesPathToGroup, formFieldGroup } = params;

    return helmValuesPathToFormFieldPath_rec({
        helmValuesPathToGroup,
        formFieldGroup,
        currentFormFieldPath: []
    });
}

function helmValuesPathToFormFieldPath_rec(params: {
    helmValuesPathToGroup: (string | number)[];
    formFieldGroup: FormFieldGroupLike;
    currentFormFieldPath: number[];
}): number[] {
    const { helmValuesPathToGroup, formFieldGroup, currentFormFieldPath } = params;

    exit_case: {
        if (helmValuesPathToGroup.length !== 0) {
            break exit_case;
        }

        return currentFormFieldPath;
    }

    const [segment, ...rest] = helmValuesPathToGroup;

    const formFieldGroup_child = formFieldGroup.nodes
        .map(node => (node.type !== "group" ? undefined : node))
        .filter(exclude(undefined))
        .find(node => node.helmValuesPath.slice(-1)[0] === segment);

    assert(formFieldGroup_child !== undefined);

    return helmValuesPathToFormFieldPath_rec({
        helmValuesPathToGroup: rest,
        formFieldGroup: formFieldGroup_child,
        currentFormFieldPath: [
            ...currentFormFieldPath,
            formFieldGroup.nodes.indexOf(formFieldGroup_child)
        ]
    });
}
