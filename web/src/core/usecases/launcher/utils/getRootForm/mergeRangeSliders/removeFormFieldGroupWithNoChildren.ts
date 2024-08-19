import type { FormFieldGroup } from "core/usecases/launcher/formTypes";

export function removeFormFieldGroupWithNoChildren(params: {
    children: FormFieldGroup["children"];
}): void {
    const { children } = params;

    while (true) {
        const { hasRemoved } = removeFormFieldGroupLeafWithNoChildren_rec({
            children
        });

        if (!hasRemoved) {
            break;
        }
    }
}

function removeFormFieldGroupLeafWithNoChildren_rec(params: {
    children: FormFieldGroup["children"];
}): { hasRemoved: boolean } {
    const { children } = params;

    let hasRemoved = false;

    children.forEach(child => {
        if (child.type === "field") {
            return;
        }

        if (child.children.length === 0) {
            children.splice(children.indexOf(child), 1);
            hasRemoved = true;
        } else {
            const { hasRemoved: hasRemoved_i } =
                removeFormFieldGroupLeafWithNoChildren_rec({
                    "children": child.children
                });

            if (hasRemoved_i) {
                hasRemoved = true;
            }
        }
    });

    return { hasRemoved };
}
