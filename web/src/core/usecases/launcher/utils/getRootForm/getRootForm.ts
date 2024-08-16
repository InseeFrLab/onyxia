import type { RootForm, FormFieldGroup, FormField } from "../../formTypes";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { StringifyableObject, Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { exclude } from "tsafe/exclude";
import { mergeRangeSliders, createTemporaryRangeSlider } from "./mergeRangeSliders";

export function getRootForm(params: {
    helmValuesSchema: JSONSchema;
    helmValues: StringifyableObject;
    dependencies: {
        chartName: string;
        helmValuesPath_enabled: (string | number)[] | undefined;
    }[];
}): RootForm {
    const { helmValuesSchema, helmValues, dependencies } = params;

    const rootForm: RootForm = {
        "main": (() => {
            const formFieldGroup_root = getRootForm_rec({
                "helmValuesPath": [],
                helmValuesSchema,
                helmValues
            });

            assert(formFieldGroup_root.type === "group");

            mergeRangeSliders({ "formFieldGroup": formFieldGroup_root });

            return formFieldGroup_root.children;
        })(),
        "disabledDependencies": dependencies
            .filter(({ helmValuesPath_enabled }) =>
                helmValuesPath_enabled === undefined
                    ? false
                    : getValueAtPathInObject({
                          "obj": helmValues,
                          "path": helmValuesPath_enabled
                      }) !== true
            )
            .map(({ chartName }) => chartName),
        "global": [],
        "dependencies": {}
    };

    const extractGroup = (params: {
        children: FormFieldGroup["children"];
        groupName: string;
    }): FormFieldGroup["children"] | undefined => {
        const { children, groupName } = params;

        const child_extracted = children
            .map(children => (children.type === "group" ? children : undefined))
            .filter(exclude(undefined))
            .find(children => children.helmValuesPathSegment === groupName);

        if (child_extracted !== undefined) {
            children.splice(children.indexOf(child_extracted), 1);
        }

        return child_extracted?.children;
    };

    rootForm.global =
        extractGroup({
            "children": rootForm.main,
            "groupName": "global"
        }) ?? [];

    dependencies
        .filter(({ chartName }) => !rootForm.disabledDependencies.includes(chartName))
        .forEach(
            ({ chartName }) =>
                (rootForm.dependencies[chartName] = {
                    "main":
                        extractGroup({
                            "children": rootForm.main,
                            "groupName": chartName
                        }) ?? [],
                    "global":
                        extractGroup({
                            "children": rootForm.global,
                            "groupName": chartName
                        }) ?? []
                })
        );

    return rootForm;
}

function getRootForm_rec(params: {
    helmValuesPath: (string | number)[];
    helmValuesSchema: JSONSchema;
    helmValues: Stringifyable;
}): FormFieldGroup | FormField {
    const { helmValues, helmValuesSchema, helmValuesPath } = params;

    // TODO
}