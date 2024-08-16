import type { FormFieldGroup } from "../../../formTypes";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";

export function helmValuesPathToFormFieldPath(params: {
    helmValuesPath: (string | number)[];
    children: FormFieldGroup["children"];
}): number[] {
    const { helmValuesPath, children } = params;

    return helmValuesPathToFormFieldPath_rec({
        helmValuesPath,
        children,
        "currentFormFieldPath": []
    });
}

function helmValuesPathToFormFieldPath_rec(params: {
    helmValuesPath: (string | number)[];
    children: FormFieldGroup["children"];
    currentFormFieldPath: number[];
}): number[] {
    const { helmValuesPath, children, currentFormFieldPath } = params;

    exit_case: {
        if (helmValuesPath.length !== 1) {
            break exit_case;
        }

        const [segment] = helmValuesPath;

        const formField = children
            .map(child => (child.type !== "group" ? undefined : child))
            .filter(exclude(undefined))
            .find(child => child.helmValuesPathSegment === segment);

        assert(formField !== undefined);

        return [...currentFormFieldPath, children.indexOf(formField)];
    }

    const [segment, ...rest] = helmValuesPath;

    const formFieldGroup = children
        .map(child => (child.type !== "group" ? undefined : child))
        .filter(exclude(undefined))
        .find(child => child.helmValuesPathSegment === segment);

    assert(formFieldGroup !== undefined);

    return helmValuesPathToFormFieldPath_rec({
        "helmValuesPath": rest,
        "children": formFieldGroup.children,
        "currentFormFieldPath": [
            ...currentFormFieldPath,
            children.indexOf(formFieldGroup)
        ]
    });
}
