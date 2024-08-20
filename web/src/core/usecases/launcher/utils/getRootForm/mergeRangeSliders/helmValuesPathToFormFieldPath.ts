import type { FormFieldGroup, FormField } from "../../../formTypes";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

type FormFieldLike = {
    type: "field";
};

assert<FormField extends FormFieldLike ? true : false>();

export type FormFieldGroupLike = {
    type: "group";
    helmValuesPathSegment: string | number;
    children: (FormFieldLike | FormFieldGroupLike)[];
};

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function helmValuesPathToFormFieldPath(params: {
    helmValuesPathToGroup: (string | number)[];
    formFieldGroup: FormFieldGroupLike;
}): number[] {
    const { helmValuesPathToGroup, formFieldGroup } = params;

    const [segment, ...rest] = helmValuesPathToGroup;

    assert(formFieldGroup.helmValuesPathSegment === segment);

    if (rest.length === 0) {
        return [];
    }

    return helmValuesPathToFormFieldPath_rec({
        "helmValuesPathToGroup": rest,
        "children": formFieldGroup.children,
        "currentFormFieldPath": []
    });
}

function helmValuesPathToFormFieldPath_rec(params: {
    helmValuesPathToGroup: (string | number)[];
    children: FormFieldGroupLike["children"];
    currentFormFieldPath: number[];
}): number[] {
    const { helmValuesPathToGroup, children, currentFormFieldPath } = params;

    exit_case: {
        if (helmValuesPathToGroup.length !== 1) {
            break exit_case;
        }

        const [segment] = helmValuesPathToGroup;

        const formField = children
            .map(child => (child.type !== "group" ? undefined : child))
            .filter(exclude(undefined))
            .find(child => child.helmValuesPathSegment === segment);

        assert(formField !== undefined);

        return [...currentFormFieldPath, children.indexOf(formField)];
    }

    const [segment, ...rest] = helmValuesPathToGroup;

    const formFieldGroup = children
        .map(child => (child.type !== "group" ? undefined : child))
        .filter(exclude(undefined))
        .find(child => child.helmValuesPathSegment === segment);

    assert(formFieldGroup !== undefined);

    return helmValuesPathToFormFieldPath_rec({
        "helmValuesPathToGroup": rest,
        "children": formFieldGroup.children,
        "currentFormFieldPath": [
            ...currentFormFieldPath,
            children.indexOf(formFieldGroup)
        ]
    });
}
