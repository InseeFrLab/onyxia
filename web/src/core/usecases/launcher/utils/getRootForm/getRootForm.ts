import type { RootForm, FormFieldGroup } from "../../formTypes";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { exclude } from "tsafe/exclude";
import { mergeRangeSliders } from "./mergeRangeSliders";
import {
    getRootFormFieldGroup,
    XOnyxiaContextLike as XOnyxiaContextLike_getRootFormFieldGroup
} from "./getRootFormFieldGroup";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";

export type XOnyxiaContextLike = XOnyxiaContextLike_getRootFormFieldGroup;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function getRootForm(params: {
    helmValuesSchema: JSONSchema;
    helmValues: Record<string, Stringifyable>;
    xOnyxiaContext: XOnyxiaContextLike;
    dependencies: {
        chartName: string;
        helmValuesPath_enabled: (string | number)[] | undefined;
    }[];
}): RootForm {
    const { helmValuesSchema, helmValues, xOnyxiaContext, dependencies } = params;

    const rootForm: RootForm = {
        "main": (() => {
            const formFieldGroup_root = getRootFormFieldGroup({
                helmValuesSchema,
                helmValues,
                xOnyxiaContext
            });

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
            .find(children => children.helmValuesPath.slice(-1)[0] === groupName);

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
