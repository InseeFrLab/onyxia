import type { StringifyableAtomic } from "core/tools/Stringifyable";

export type JSONSchemaLike = {
    type?: "object" | "array" | "string" | "boolean" | "integer" | "number";
    items?: JSONSchemaLike;
    properties?: Record<string, JSONSchemaLike>;
};

type PatchEntry = {
    path: (string | number)[];
    value: StringifyableAtomic | undefined;
};

/**
 * Aligns the type of each patch value on the type declared by the chart's schema,
 * so the form never receives e.g. the number 0 for a field typed "string".
 * Paths unknown to the schema keep the old guess (booleans/numbers from strings).
 * Digit-only path segments under an array in the schema become array indexes.
 */
export function coerceHelmValuesPatch(params: {
    helmValuesPatch: PatchEntry[];
    helmValuesSchema: JSONSchemaLike;
}): PatchEntry[] {
    const { helmValuesPatch, helmValuesSchema } = params;

    return helmValuesPatch.map(({ path, value }) => {
        const { path: path_normalized, type } = resolvePathInSchema({
            helmValuesSchema,
            path
        });

        return { path: path_normalized, value: coerceValue({ value, type }) };
    });
}

function resolvePathInSchema(params: {
    helmValuesSchema: JSONSchemaLike;
    path: (string | number)[];
}): { path: (string | number)[]; type: JSONSchemaLike["type"] } {
    let node: JSONSchemaLike | undefined = params.helmValuesSchema;

    const path = params.path.map(segment => {
        if (
            typeof segment === "string" &&
            /^\d+$/.test(segment) &&
            node?.type === "array"
        ) {
            node = node.items;
            return Number(segment);
        }

        node = typeof segment === "number" ? node?.items : node?.properties?.[segment];
        return segment;
    });

    return { path, type: node?.type };
}

function coerceValue(params: {
    value: StringifyableAtomic | undefined;
    type: JSONSchemaLike["type"];
}): StringifyableAtomic | undefined {
    const { value, type } = params;

    if (value === undefined || value === null) {
        return value;
    }

    switch (type) {
        case "string":
            return typeof value === "string" ? value : String(value);
        case "boolean":
            return typeof value === "string" ? (parseBoolean(value) ?? value) : value;
        case "integer":
        case "number":
            return typeof value === "string" ? (parseNumber(value) ?? value) : value;
        default:
            if (typeof value !== "string") {
                return value;
            }
            return parseBoolean(value) ?? parseNumber(value) ?? value;
    }
}

function parseBoolean(str: string): boolean | undefined {
    return str === "true" ? true : str === "false" ? false : undefined;
}

function parseNumber(str: string): number | undefined {
    const trimmed = str.trim();

    return trimmed !== "" && !isNaN(Number(trimmed)) ? Number(trimmed) : undefined;
}
