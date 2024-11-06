import { getValueAtPathInObject } from "core/tools/getValueAtPathInObject";
import { isAmong } from "tsafe/isAmong";
import type { Stringifyable } from "core/tools/Stringifyable";
import { assert } from "tsafe/assert";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";

export type XOnyxiaContextLike = {};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

type Params = {
    expression: string;
    xOnyxiaContext: Record<string, unknown>;
};

export function resolveXOnyxiaValueReference(params: Params): Stringifyable | undefined {
    const { expression, xOnyxiaContext } = params;

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

    return resolveXOnyxiaValueReference({
        expression: `{{${expression}}}`,
        xOnyxiaContext
    });
}
