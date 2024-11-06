import type { RootForm, FormFieldGroup, FormField } from "../../formTypes";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { getHelmValuesPathDeeperCommonSubpath } from "../../shared/getHelmValuesPathDeeperCommonSubpath";

function rootFormToNodes(rootForm: RootForm): FormFieldGroup["nodes"] {
    return [
        ...rootForm.main,
        ...rootForm.global,
        ...Object.values(rootForm.dependencies)
            .map(({ main, global }) => [...main, ...global])
            .flat()
    ];
}

export function findInRootForm(params: {
    rootForm: RootForm;
    helmValuesPath: (string | number)[];
}): Exclude<FormField, FormField.RangeSlider> {
    const { rootForm, helmValuesPath } = params;

    const formField = findInRootForm_rec({
        nodes: rootFormToNodes(rootForm),
        helmValuesPath: helmValuesPath
    });

    assert(formField !== undefined);
    assert(formField.type !== "group");

    return formField;
}

function findInRootForm_rec(params: {
    nodes: FormFieldGroup["nodes"];
    helmValuesPath: (string | number)[];
}): Exclude<FormField, FormField.RangeSlider> | FormFieldGroup | undefined {
    const { nodes, helmValuesPath } = params;

    for (const node of nodes) {
        switch (node.type) {
            case "field":
                if (node.fieldType === "range slider") {
                    continue;
                }
                if (!same(node.helmValuesPath, helmValuesPath)) {
                    continue;
                }
                return node;
            case "group": {
                if (
                    !getDoesPathStartWith({
                        shorterPath: node.helmValuesPath,
                        longerPath: helmValuesPath
                    })
                ) {
                    continue;
                }
                if (node.helmValuesPath.length === helmValuesPath.length) {
                    return node;
                }
                const formField = findInRootForm_rec({
                    nodes: node.nodes,
                    helmValuesPath: helmValuesPath
                });
                if (formField === undefined) {
                    continue;
                }
                return formField;
            }
        }
    }
    return undefined;
}

export function findInRootForm_rangeSlider(params: {
    rootForm: RootForm;
    helmValuesPath_lowEndRange: (string | number)[];
    helmValuesPath_highEndRange: (string | number)[];
}): FormField.RangeSlider {
    const { rootForm, helmValuesPath_highEndRange, helmValuesPath_lowEndRange } = params;

    const formFieldGroup = findInRootForm_rec({
        nodes: rootFormToNodes(rootForm),
        helmValuesPath: getHelmValuesPathDeeperCommonSubpath({
            helmValuesPath1: helmValuesPath_lowEndRange,
            helmValuesPath2: helmValuesPath_highEndRange
        })
    });

    assert(formFieldGroup !== undefined);
    assert(formFieldGroup.type === "group");

    for (const node of formFieldGroup.nodes) {
        if (node.type !== "field") {
            continue;
        }
        if (node.fieldType !== "range slider") {
            continue;
        }
        if (!same(node.lowEndRange.helmValuesPath, helmValuesPath_lowEndRange)) {
            continue;
        }
        if (!same(node.highEndRange.helmValuesPath, helmValuesPath_highEndRange)) {
            continue;
        }
        return node;
    }

    assert(false);
}

function getDoesPathStartWith(params: {
    shorterPath: (string | number)[];
    longerPath: (string | number)[];
}) {
    const { shorterPath, longerPath } = params;

    for (let i = 0; i < shorterPath.length; i++) {
        if (shorterPath[i] !== longerPath[i]) {
            return false;
        }
    }

    return true;
}
