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
    chartName: string;
    helmValuesSchema: JSONSchema;
    helmValues: Record<string, Stringifyable>;
    xOnyxiaContext: XOnyxiaContextLike;
    helmDependencies: {
        chartName: string;
        condition: (string | number)[] | undefined;
    }[];
}): RootForm {
    const { chartName, helmValuesSchema, helmValues, xOnyxiaContext, helmDependencies } =
        params;

    const rootForm: RootForm = {
        main: (() => {
            const formFieldGroup_root = computeRootFormFieldGroup({
                helmValuesSchema,
                helmValues,
                xOnyxiaContext
            });

            mergeRangeSliders({ formFieldGroup: formFieldGroup_root });

            return formFieldGroup_root.nodes;
        })(),
        disabledDependencies: helmDependencies
            .filter(({ condition }) =>
                condition === undefined
                    ? false
                    : getValueAtPathInObject({
                          obj: helmValues,
                          path: condition
                      }) !== true
            )
            .map(({ chartName }) => chartName),
        global: [],
        dependencies: {}
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
            nodes: rootForm.main,
            groupName: "global"
        }) ?? [];

    helmDependencies
        .filter(({ chartName }) => !rootForm.disabledDependencies.includes(chartName))
        .forEach(({ chartName }) => {
            const main =
                extractGroup({
                    nodes: rootForm.main,
                    groupName: chartName
                }) ?? [];

            const global =
                extractGroup({
                    nodes: rootForm.global,
                    groupName: chartName
                }) ?? [];

            if (main.length === 0 && global.length === 0) {
                return;
            }

            rootForm.dependencies[chartName] = { main, global };
        });

    extract_dependency_matching_chartName: {
        const dependency = rootForm.dependencies[chartName];

        if (dependency === undefined) {
            break extract_dependency_matching_chartName;
        }

        (["main", "global"] as const).forEach(mainOrGlobal =>
            [...dependency[mainOrGlobal]].forEach(node => {
                {
                    const conflictingNode = rootForm[mainOrGlobal].find(
                        (() => {
                            switch (node.type) {
                                case "group":
                                    return node_i =>
                                        node_i.type === "group" &&
                                        node_i.helmValuesPath.slice(-1)[0] ===
                                            node.helmValuesPath.slice(-1)[0];
                                case "field":
                                    return node_i =>
                                        node_i.type === "field" &&
                                        node_i.title === node.title;
                            }
                        })()
                    );

                    if (conflictingNode !== undefined) {
                        return;
                    }
                }

                dependency[mainOrGlobal].splice(
                    dependency[mainOrGlobal].indexOf(node),
                    1
                );

                rootForm[mainOrGlobal].push(node);
            })
        );

        if (dependency.global.length === 0 && dependency.main.length === 0) {
            delete rootForm.dependencies[chartName];
        }
    }

    return rootForm;
}
