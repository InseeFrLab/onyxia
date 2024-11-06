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

    nodes.forEach(node => {
        if (node.type === "field") {
            return;
        }

        if (node.nodes.length === 0) {
            if (node.canAdd) {
                return;
            }
            nodes.splice(nodes.indexOf(node), 1);
            hasRemoved = true;
        } else {
            const { hasRemoved: hasRemoved_i } = removeFormFieldGroupLeafWithNoNodes_rec({
                nodes: node.nodes
            });

            if (hasRemoved_i) {
                hasRemoved = true;
            }
        }
    });

    return { hasRemoved };
}
