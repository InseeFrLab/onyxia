import type { RootForm, FormFieldGroup } from "../formTypes";
import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { Stringifyable } from "core/tools/Stringifyable";
import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { exclude } from "tsafe/exclude";
import { mergeRangeSliders } from "./mergeRangeSliders";
import {
    computeRootFormFieldGroup,
    type XOnyxiaContextLike as XOnyxiaContextLike_computeRootFormFieldGroup
} from "./computeRootFormFieldGroup";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";

export type XOnyxiaContextLike = XOnyxiaContextLike_computeRootFormFieldGroup;

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function computeRootForm(params: {
    helmValuesSchema: JSONSchema;
    helmValues: Record<string, Stringifyable>;
    xOnyxiaContext: XOnyxiaContextLike;
    helmDependencies: {
        chartName: string;
        condition: (string | number)[] | undefined;
    }[];
}): RootForm {
    const { helmValuesSchema, helmValues, xOnyxiaContext, helmDependencies } = params;

    const rootForm: RootForm = {
        "main": (() => {
            const formFieldGroup_root = computeRootFormFieldGroup({
                helmValuesSchema,
                helmValues,
                xOnyxiaContext
            });

            mergeRangeSliders({ "formFieldGroup": formFieldGroup_root });

            return formFieldGroup_root.nodes;
        })(),
        "disabledDependencies": helmDependencies
            .filter(({ condition }) =>
                condition === undefined
                    ? false
                    : getValueAtPathInObject({
                          "obj": helmValues,
                          "path": condition
                      }) !== true
            )
            .map(({ chartName }) => chartName),
        "global": [],
        "dependencies": {}
    };

    const extractGroup = (params: {
        nodes: FormFieldGroup["nodes"];
        groupName: string;
    }): FormFieldGroup["nodes"] | undefined => {
        const { nodes, groupName } = params;

        const child_extracted = nodes
            .map(nodes => (nodes.type === "group" ? nodes : undefined))
            .filter(exclude(undefined))
            .find(nodes => nodes.helmValuesPath.slice(-1)[0] === groupName);

        if (child_extracted !== undefined) {
            nodes.splice(nodes.indexOf(child_extracted), 1);
        }

        return child_extracted?.nodes;
    };

    rootForm.global =
        extractGroup({
            "nodes": rootForm.main,
            "groupName": "global"
        }) ?? [];

    helmDependencies
        .filter(({ chartName }) => !rootForm.disabledDependencies.includes(chartName))
        .forEach(
            ({ chartName }) =>
                (rootForm.dependencies[chartName] = {
                    "main":
                        extractGroup({
                            "nodes": rootForm.main,
                            "groupName": chartName
                        }) ?? [],
                    "global":
                        extractGroup({
                            "nodes": rootForm.global,
                            "groupName": chartName
                        }) ?? []
                })
        );

    return rootForm;
}
