import type { Secret } from "core/ports/SecretsManager";
import { assert } from "tsafe/assert";

export function valueToSecret(value: any): Secret {
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return { value: value };
    }

    if (value === undefined) {
        return {};
    }

    return { valueAsJson: JSON.stringify(value) };
}

export function secretToValue(secret: Secret): unknown {
    const [key, ...otherKeys] = Object.keys(secret);

    assert(
        key === undefined ||
            ((key === "value" || key === "valueAsJson") && otherKeys.length === 0),
        `project config secret should have only one key, either "value" or "valueAsJson", got ${JSON.stringify(
            secret
        )}`
    );

    switch (key) {
        case undefined:
            return undefined;
        case "value":
            return secret[key];
        case "valueAsJson": {
            const valueStr = secret[key];

            assert(typeof valueStr === "string");

            return JSON.parse(valueStr);
        }
    }
}
