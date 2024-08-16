import type { FormFieldGroup, FormField } from "../../../formTypes";
import { exclude } from "tsafe/exclude";

export function getFormFieldPath(params: {
    formFieldGroup: FormFieldGroup;
    predicate: (formField: FormField) => boolean;
}): number[] | undefined {
    const { formFieldGroup, predicate } = params;

    return getFormFieldPath_rec({
        formFieldGroup,
        predicate,
        "formFieldPath": []
    });
}

function getFormFieldPath_rec(params: {
    formFieldPath: number[];
    formFieldGroup: FormFieldGroup;
    predicate: (formField: FormField) => boolean;
}): number[] | undefined {
    const { formFieldPath, formFieldGroup, predicate } = params;

    {
        const i = formFieldGroup.children.findIndex(child => {
            if (child.type !== "field") {
                return false;
            }

            return predicate(child);
        });

        if (i !== -1) {
            return [...formFieldPath, i];
        }
    }

    for (const [formFieldGroup_i, i] of formFieldGroup.children
        .map((child, index) => {
            if (child.type === "field") {
                return undefined;
            }

            return [child, index] as const;
        })
        .filter(exclude(undefined))) {
        const formFieldPath_next = getFormFieldPath_rec({
            "formFieldGroup": formFieldGroup_i,
            "formFieldPath": [...formFieldPath, i],
            predicate
        });

        if (formFieldPath_next !== undefined) {
            return formFieldPath_next;
        }
    }

    return undefined;
}
