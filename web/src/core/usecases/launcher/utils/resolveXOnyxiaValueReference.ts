import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { isAmong } from "tsafe/isAmong";

type Params = {
    expression: unknown;
    xOnyxiaContext: Record<string, unknown>;
};

function resolveXOnyxiaValueReference_rec(params: Params & { isRoot: boolean }): unknown {
    const { isRoot, expression: expression_unknown, xOnyxiaContext } = params;

    if (typeof expression_unknown === "string") {
        const expression_str = expression_unknown;

        full_substitution: {
            const match = expression_str.match(/^{{([^}]+)}}$/);

            if (match === null) {
                break full_substitution;
            }

            const dotInPropertyNamePlaceholder = "DOT_IN_PROPERTY_NAME_avSdWd0k";
            const replaceDot = (str: string) =>
                str.replace(/\./g, dotInPropertyNamePlaceholder);

            return getValueAtPathInObject({
                "path": match[1]
                    .replace(/\[(\d+)\]/g, ".$1")
                    .replace(/\["([^"]+)"\]/g, (...[, g]) => `.${replaceDot(g)}`)
                    .replace(/\['([^']+)'\]/g, (...[, g]) => `.${replaceDot(g)}`)
                    .split(".")
                    .map(part =>
                        part.replace(new RegExp(dotInPropertyNamePlaceholder, "g"), ".")
                    ),
                "obj": xOnyxiaContext
            });
        }

        string_substitution: {
            if (!expression_str.includes("{{")) {
                break string_substitution;
            }

            let hasPartResolvedToUndefinedOrNonPrimitive = false;

            const resolved = expression_str.replace(
                /(\{\{[^}]+\}\})/g,
                (...[, group]) => {
                    const resolved = resolveXOnyxiaValueReference_rec({
                        "expression": group,
                        xOnyxiaContext,
                        "isRoot": false
                    });

                    if (!isAmong(["string", "number", "boolean"], typeof resolved)) {
                        hasPartResolvedToUndefinedOrNonPrimitive = true;
                        return "";
                    }

                    return `${resolved}`;
                }
            );

            if (hasPartResolvedToUndefinedOrNonPrimitive) {
                return undefined;
            }

            return resolved;
        }

        implicit_reference: {
            if (!isRoot) {
                break implicit_reference;
            }

            return resolveXOnyxiaValueReference_rec({
                "expression": `{{${expression_str}}}`,
                xOnyxiaContext,
                "isRoot": true
            });
        }

        return expression_str;
    }

    if (expression_unknown instanceof Array) {
        return expression_unknown.map(entry =>
            resolveXOnyxiaValueReference_rec({
                "expression": entry,
                "isRoot": false,
                xOnyxiaContext
            })
        );
    }

    if (expression_unknown instanceof Object) {
        return Object.fromEntries(
            Object.entries(expression_unknown).map(([key, value]) => [
                key,
                resolveXOnyxiaValueReference_rec({
                    "expression": value,
                    "isRoot": false,
                    xOnyxiaContext
                })
            ])
        );
    }

    return expression_unknown;
}

export function resolveXOnyxiaValueReference(params: Params): unknown {
    const { expression, xOnyxiaContext } = params;
    return resolveXOnyxiaValueReference_rec({
        expression,
        xOnyxiaContext,
        "isRoot": true
    });
}
