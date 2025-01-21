import type { Table, DataType, Vector } from "apache-arrow";
import { Column } from "core/ports/SqlOlap";
import { assert } from "tsafe/assert";

export async function createArrowTableApi() {
    const { Type, Int } = await import("apache-arrow");

    // Helper function to map Arrow DataType to a user-friendly Column.type
    const getColumnType = (type: DataType): Column["type"] => {
        switch (type.typeId) {
            case Type.Int: {
                assert(type instanceof Int);
                if (type.bitWidth === 64) {
                    return "bigint";
                }
                return "number";
            }

            case Type.Decimal:
            case Type.Float:
                return "number";

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

            case Type.Duration: //Not supported in Parquet yet
            case Type.FixedSizeList:
            case Type.Map:
            case Type.Union:
            case Type.Struct:
            case Type.Interval:
            case Type.List:
                return "string";

            default:
                throw new Error(
                    `Unsupported Arrow DataType: ${Type[type.typeId] || "Unknown"} (${type.typeId})`
                );
        }
    };

    function arrowTableToColumns(params: { table: Table<any> }) {
        const { table } = params;

        return table.schema.fields.map(field => {
            const columnType = getColumnType(field.type);
            return {
                name: field.name,
                type: columnType,
                rowType: field.type.toString()
            };
        });
    }

    const arrowTableToRows = (params: { table: Table<any>; columns: Column[] }) => {
        const { table, columns } = params;

        const rows: Record<string, any>[] = Array.from(
            { length: table.numRows },
            () => ({})
        );

        for (const column of columns) {
            const field = table.schema.fields.find(field => field.name === column.name);
            assert(field !== undefined, `Field "${column.name}" not found in schema.`);

            const vector = table.getChild(column.name);
            assert(vector !== null, `Column vector for "${column.name}" not found.`);

            const transformedColumn = convertVector({
                vector,
                expectedType: column.type
            });

            for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
                rows[rowIndex][column.name] = transformedColumn[rowIndex];
            }
        }

        return rows;
    };

    const convertVector = (params: {
        vector: Vector<any>;
        expectedType: Column["type"];
    }) => {
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
                //return Array.from(vector.toArray()).map(value => BigInt(value as bigint)); #waiting for https://github.com/microsoft/TypeScript/issues/46395
                return Array.from(vector.toArray()).map(String);
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

    return { arrowTableToRows, arrowTableToColumns };
}
