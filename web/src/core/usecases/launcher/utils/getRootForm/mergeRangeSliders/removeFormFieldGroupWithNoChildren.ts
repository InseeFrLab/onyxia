import type { FormFieldGroup } from "../../../formTypes";

export function removeFormFieldGroupWithNoChildren(params: {
    formFieldGroup: FormFieldGroup;
}): void {
    const { formFieldGroup } = params;

    while (true) {
        const { hasRemoved } = removeFormFieldGroupLeafWithNoChildren_rec({
            formFieldGroup
        });

        if (!hasRemoved) {
            break;
        }
    }
}

function removeFormFieldGroupLeafWithNoChildren_rec(params: {
    formFieldGroup: FormFieldGroup;
}): { hasRemoved: boolean } {
    const { formFieldGroup } = params;

    let hasRemoved = false;

    formFieldGroup.children.forEach(child => {
        if (child.type === "field") {
            return;
        }

        if (child.children.length === 0) {
            formFieldGroup.children.splice(formFieldGroup.children.indexOf(child), 1);
            hasRemoved = true;
        } else {
            const { hasRemoved: hasRemoved_i } =
                removeFormFieldGroupLeafWithNoChildren_rec({ "formFieldGroup": child });

            if (hasRemoved_i) {
                hasRemoved = true;
            }
        }
    });

    return { hasRemoved };
}
