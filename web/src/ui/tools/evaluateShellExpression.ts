import { parse as shellQuoteParse } from "shell-quote";
import { assert } from "tsafe/assert";

/** Can throw! */
export function evaluateShellExpression(params: {
    expression: string;
    getEnvValue(params: { envName: string }): string | undefined;
}): undefined | string {
    const { expression, getEnvValue } = params;

    const parsed = shellQuoteParse(
        expression,
        new Proxy(
            {},
            {
                "get": function (...[, prop]) {
                    assert(typeof prop === "string");

                    return getEnvValue({ "envName": prop }) ?? `$${prop}`;
                }
            }
        )
    );

    if (parsed.find(entry => typeof entry !== "string") !== undefined) {
        return undefined;
    }

    return parsed.join(" ");
}
