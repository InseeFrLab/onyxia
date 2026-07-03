import type { FormFieldGroup, FormField } from "../../formTypes";
import { assert } from "tsafe/assert";

type FormFieldLike = {
    type: "field";
};

assert<FormField extends FormFieldLike ? true : false>();

export type FormFieldGroupLike = {
    type: "group";
    nodes: (FormFieldLike | FormFieldGroupLike)[];
    canAdd: boolean;
};

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function removeFormFieldGroupWithNoNodes(params: {
    nodes: FormFieldGroupLike["nodes"];
}): void {
    const { nodes } = params;

    while (true) {
        const { hasRemoved } = removeFormFieldGroupLeafWithNoNodes_rec({
            nodes
        });

        if (!hasRemoved) {
            break;
        }
    }
}

function removeFormFieldGroupLeafWithNoNodes_rec(params: {
    nodes: FormFieldGroupLike["nodes"];
}): { hasRemoved: boolean } {
    const { nodes } = params;

    let hasRemoved = false;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];

        if (node.type === "field") {
            continue;
        }

        if (node.nodes.length === 0) {
            if (node.canAdd) {
                continue;
            }
            nodes.splice(i, 1);
            hasRemoved = true;
        } else {
            const { hasRemoved: hasRemoved_i } = removeFormFieldGroupLeafWithNoNodes_rec({
                nodes: node.nodes
            });

            if (hasRemoved_i) {
                hasRemoved = true;
            }
        }
    }

    return { hasRemoved };
}
