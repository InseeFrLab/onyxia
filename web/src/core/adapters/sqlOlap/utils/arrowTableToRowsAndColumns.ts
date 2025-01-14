import type { Table, DataType, Vector } from "apache-arrow";
import { Column } from "core/ports/SqlOlap";
import { assert } from "tsafe/assert";

// Helper function to map Arrow DataType to a user-friendly Column.type
const getColumnType = async (type: DataType): Promise<Column["type"]> => {
    const { Type, Int } = await import("apache-arrow");
    switch (type.typeId) {
        case Type.Int: {
            assert(type instanceof Int);
            if (type.bitWidth === 64) {
                return "bigint";
            }
            return "number";
        }

        case Type.Float: {
            return "number";
        }
        case Type.Utf8:
        case Type.LargeUtf8:
            return "string";

        case Type.Bool:
            return "boolean";

        case Type.Time:
        case Type.Timestamp:
            return "dateTime";

        case Type.Date:
            return "date";

        case Type.Binary:
        case Type.LargeBinary:
        case Type.FixedSizeBinary:
            return "binary";

        case Type.Struct:
        case Type.List:
            return "string";
        default:
            throw new Error(
                `Unsupported Arrow DataType: ${Type[type.typeId] || "Unknown"} (${type.typeId})`
            );
    }
};

export const arrowTableToRowsAndColumns = async (params: { table: Table<any> }) => {
    const { table } = params;

    const rows: Record<string, any>[] = Array.from({ length: table.numRows }, () => ({}));
    const columns: Column[] = [];

    for (const field of table.schema.fields) {
        const column = table.getChild(field.name);
        assert(column !== null, `Column for field "${field.name}" not found.`);

        const columnType = await getColumnType(field.type);

        columns.push({
            name: field.name,
            type: columnType
        });

        const transformedColumn = convertVector({
            vector: column,
            expectedType: columnType
        });

        for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
            rows[rowIndex][field.name] = transformedColumn[rowIndex];
        }
    }

    return { rows, columns };
};

const convertVector = (params: { vector: Vector<any>; expectedType: Column["type"] }) => {
    const { vector, expectedType } = params;

    switch (expectedType) {
        case "boolean":
            return Array.from(vector.toArray()).map(Boolean);
        case "string":
            return Array.from(vector.toArray()).map(String);
        case "date":
            return Array.from(vector.toArray()).map(value => {
                if (value === null) {
                    return null;
                }
                assert(typeof value === "number");
                return new Date(value);
            });
        case "dateTime": {
            return Array.from(vector.toArray()).map(value => {
                if (value === null) {
                    return null;
                }
                assert(typeof value === "bigint");
                const milliseconds = value / 1_000_000n; //Timestamps are in nanoseconds
                return new Date(Number(milliseconds));
            });
        }

        case "number":
            return Array.from(vector.toArray()).map(Number);
        case "bigint":
            return Array.from(vector.toArray()).map(String);
            return Array.from(vector.toArray()).map(value => BigInt(value as bigint));
        case "binary":
            return Array.from(vector.toArray()).map(value => {
                if (value instanceof Uint8Array) {
                    return Array.from(value)
                        .map(byte => byte.toString(16).padStart(2, "0"))
                        .join("");
                }
                return value;
            });
    }
};
