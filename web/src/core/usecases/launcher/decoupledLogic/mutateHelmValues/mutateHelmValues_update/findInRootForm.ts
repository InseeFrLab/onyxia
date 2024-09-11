import type { RootForm, FormFieldGroup, FormField } from "../../formTypes";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { getHelmValuesPathDeeperCommonSubpath } from "../../shared/getHelmValuesPathDeeperCommonSubpath";

function rootFormToChildren(rootForm: RootForm): FormFieldGroup["children"] {
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
        "children": rootFormToChildren(rootForm),
        "helmValuesPath": helmValuesPath
    });

    assert(formField !== undefined);
    assert(formField.type !== "group");

    return formField;
}

function findInRootForm_rec(params: {
    children: FormFieldGroup["children"];
    helmValuesPath: (string | number)[];
}): Exclude<FormField, FormField.RangeSlider> | FormFieldGroup | undefined {
    const { children, helmValuesPath } = params;

    for (const child of children) {
        switch (child.type) {
            case "field":
                if (child.fieldType === "range slider") {
                    continue;
                }
                if (!same(child.helmValuesPath, helmValuesPath)) {
                    continue;
                }
                return child;
            case "group": {
                if (
                    !getDoesPathStartWith({
                        "shorterPath": child.helmValuesPath,
                        "longerPath": helmValuesPath
                    })
                ) {
                    continue;
                }
                if (child.helmValuesPath.length === helmValuesPath.length) {
                    return child;
                }
                const formField = findInRootForm_rec({
                    "children": child.children,
                    "helmValuesPath": helmValuesPath
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
        "children": rootFormToChildren(rootForm),
        "helmValuesPath": getHelmValuesPathDeeperCommonSubpath({
            "helmValuesPath1": helmValuesPath_lowEndRange,
            "helmValuesPath2": helmValuesPath_highEndRange
        })
    });

    assert(formFieldGroup !== undefined);
    assert(formFieldGroup.type === "group");

    for (const child of formFieldGroup.children) {
        if (child.type !== "field") {
            continue;
        }
        if (child.fieldType !== "range slider") {
            continue;
        }
        if (!same(child.lowEndRange.helmValuesPath, helmValuesPath_lowEndRange)) {
            continue;
        }
        if (!same(child.highEndRange.helmValuesPath, helmValuesPath_highEndRange)) {
            continue;
        }
        return child;
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
