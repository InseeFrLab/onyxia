import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { isAmong } from "tsafe/isAmong";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type XOnyxiaContextLike = {};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

type Params = {
    expression: string | Stringifyable[] | Record<string, Stringifyable>;
    xOnyxiaContext: Record<string, unknown>;
};

export function resolveXOnyxiaValueReference(params: Params): Stringifyable | undefined {
    return resolveXOnyxiaValueReference_rec({
        ...params,
        isTopLevel: true
    });
}

function resolveXOnyxiaValueReference_rec(
    params: Params & { isTopLevel: boolean }
): Stringifyable | undefined {
    const { expression, xOnyxiaContext, isTopLevel } = params;

    if (expression instanceof Array) {
        const resolvedArray = expression.map(item => {
            if (item === null) {
                return null;
            }

            if (typeof item === "boolean") {
                return item;
            }

            if (typeof item === "number") {
                return item;
            }

            return resolveXOnyxiaValueReference_rec({
                expression: item,
                xOnyxiaContext,
                isTopLevel: false
            });
        });

        const resolvedArray_noUndefined = resolvedArray.filter(exclude(undefined));

        if (resolvedArray_noUndefined.length !== resolvedArray.length) {
            return undefined;
        }

        return resolvedArray_noUndefined;
    }

    if (expression instanceof Object) {
        const resolvedRecord: Record<string, Stringifyable> = {};

        for (const [key, value] of Object.entries(expression)) {
            const resolvedValue = (() => {
                if (value === null) {
                    return null;
                }

                if (typeof value === "boolean") {
                    return value;
                }

                if (typeof value === "number") {
                    return value;
                }

                return resolveXOnyxiaValueReference_rec({
                    expression: value,
                    xOnyxiaContext,
                    isTopLevel: false
                });
            })();

            if (resolvedValue === undefined) {
                return undefined;
            }

            resolvedRecord[key] = resolvedValue;
        }

        return resolvedRecord;
    }

    full_substitution: {
        const match = expression.match(/^{{([^}]+)}}$/);

        if (match === null) {
            break full_substitution;
        }

        const dotInPropertyNamePlaceholder = "DOT_IN_PROPERTY_NAME_avSdWd0k";
        const replaceDot = (str: string) =>
            str.replace(/\./g, dotInPropertyNamePlaceholder);

        return getValueAtPathInObject<Stringifyable>({
            path: match[1]
                .replace(/\[(\d+)\]/g, ".$1")
                .replace(/\["([^"]+)"\]/g, (...[, g]) => `.${replaceDot(g)}`)
                .replace(/\['([^']+)'\]/g, (...[, g]) => `.${replaceDot(g)}`)
                .split(".")
                .map(part =>
                    part.replace(new RegExp(dotInPropertyNamePlaceholder, "g"), ".")
                ),
            obj: xOnyxiaContext
        });
    }

    string_substitution: {
        if (!expression.includes("{{")) {
            break string_substitution;
        }

        let hasResolvedToSomethingOtherThanStringNumberOrBoolean = false;

        const resolved = expression.replace(/(\{\{[^}]+\}\})/g, (...[, group]) => {
            const resolved = resolveXOnyxiaValueReference({
                expression: group,
                xOnyxiaContext
            });

            if (!isAmong(["string", "number", "boolean"], typeof resolved)) {
                hasResolvedToSomethingOtherThanStringNumberOrBoolean = true;
                return "";
            }

            return `${resolved}`;
        });

        if (hasResolvedToSomethingOtherThanStringNumberOrBoolean) {
            return undefined;
        }

        return resolved;
    }

    if (!isTopLevel) {
        return expression;
    }

    return resolveXOnyxiaValueReference({
        expression: `{{${expression}}}`,
        xOnyxiaContext
    });
}
