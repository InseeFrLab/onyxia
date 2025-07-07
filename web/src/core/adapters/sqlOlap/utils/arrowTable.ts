import type { Table, DataType, Vector } from "apache-arrow";
import type { Column } from "core/ports/SqlOlap";
import { assert } from "tsafe/assert";

export async function createArrowTableApi() {
    const { Type, Int, Decimal, Time } = await import("apache-arrow");

    function arrowTableToJsData(params: { table: Table<any> }): {
        columns: Column[];
        rows: Record<string, any>[];
    } {
        const columns = arrowTableToColumns({ table: params.table });
        const rows = arrowTableToRows({ table: params.table, columns });
        return { columns, rows };
    }
    // Helper function to map Arrow DataType to a user-friendly Column.type
    const getColumnType = (type: DataType): Column["type"] => {
        switch (type.typeId) {
            case Type.Int: {
                assert(type instanceof Int);
                if (type.bitWidth === 64) {
                    return "string"; // must be changed to bigint when https://github.com/microsoft/TypeScript/issues/46395
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

            case Type.Timestamp:
                return "dateTime";

            case Type.Date:
                return "date";

            case Type.Time:
                return "time";

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
                displayType: field.type.toString(),
                arrowType: field.type
            };
        });
    }

    function arrowTableToRows(params: {
        table: Table<any>;
        columns: ReturnType<typeof arrowTableToColumns>;
    }) {
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
                expectedType: column.type,
                dataType: column.arrowType
            });

            for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
                rows[rowIndex][column.name] = transformedColumn[rowIndex];
            }
        }

        return rows;
    }

    const convertVector = (params: {
        vector: Vector<any>;
        expectedType: Column["type"];
        dataType: DataType;
    }) => {
        const { vector, expectedType, dataType } = params;

        return Array.from({ length: vector.length }, (_, i) => {
            const value = vector.get(i);

            if (value === null) return null;

            switch (expectedType) {
                case "boolean":
                    return Boolean(value);
                case "string":
                    return String(value);
                case "date":
                    assert(typeof value === "number");
                    return new Date(value);
                case "dateTime": {
                    return new Date(Number(value));
                }
                case "time":
                    assert(dataType instanceof Time);
                    return decodeTime(value, dataType.unit);
                case "number": {
                    if (dataType instanceof Decimal) {
                        return decodeDecimal(value, dataType.scale);
                    }
                    return Number(value);
                }
                case "binary":
                    if (value instanceof Uint8Array) {
                        return Array.from(value)
                            .map(byte => byte.toString(16).padStart(2, "0"))
                            .join("");
                    }

                    return value;
            }
        });
    };

    return { arrowTableToJsData };
}

function decodeDecimal(uint32Array: Uint32Array, scale: number): number {
    if (uint32Array.length !== 4) {
        throw new Error("Expected Uint32Array of length 4 for Decimal128");
    }

    // Combine 4 32-bit integers into one 128-bit BigInt (little-endian)
    const low = BigInt(uint32Array[0]) + (BigInt(uint32Array[1]) << 32n);
    const high = BigInt(uint32Array[2]) + (BigInt(uint32Array[3]) << 32n);
    let raw = (high << 64n) + low;

    // Apply two's complement for negative numbers
    const max128 = 1n << 128n;
    if (raw > max128 >> 1n) {
        raw -= max128;
    }

    const isNegative = raw < 0n;
    const abs = isNegative ? -raw : raw;

    const integerPart = abs / BigInt(10 ** scale);
    const decimalPart = abs % BigInt(10 ** scale);

    const decimalStr = `${integerPart.toString()}.${decimalPart.toString().padStart(scale, "0")}`;

    return parseFloat(isNegative ? `-${decimalStr}` : decimalStr);
}

function decodeTime(
    value: number | bigint,
    unit: 0 | 1 | 2 | 3 = 3 // default: nanoseconds
): string {
    const factor = [1_000_000_000n, 1_000_000n, 1_000n, 1n][unit]; // secondes → nanos
    const ns = BigInt(value) * factor;

    const totalSeconds = ns / 1_000_000_000n;
    const subsecond = ns % 1_000_000_000n;

    const hours = (totalSeconds / 3600n).toString().padStart(2, "0");
    const minutes = ((totalSeconds % 3600n) / 60n).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60n).toString().padStart(2, "0");

    const fraction = subsecond.toString().padStart(9, "0").replace(/0+$/, "");

    return fraction
        ? `${hours}:${minutes}:${seconds}.${fraction}+00`
        : `${hours}:${minutes}:${seconds}+00`;
}
