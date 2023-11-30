import { useMemo, useCallback } from "react";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ResizableColumnHeader } from "./ResizableColumnHeader";
import { useStyles } from "tss";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useConst } from "powerhooks";
import memoize from "memoizee";

export const ResizableDataGrid: typeof DataGrid = ({ columns, ...props }) => {
    const { getInitialWidths } = (function useClosure() {
        const columnsDigest = useConst(() =>
            memoize(
                (c: typeof columns) =>
                    JSON.stringify(
                        c.map(column => ({
                            "field": column.field,
                            "width": column.width
                        }))
                    ),
                { "max": 1 }
            )
        );

        const getInitialWidths = useCallback(() => {
            const initialWidths: Record<string, number> = {};
            columns.forEach(column => {
                initialWidths[column.field] =
                    column.width ?? column.field.length * 9 + 100;
            });

            const sum = Object.values(initialWidths).reduce((a, b) => a + b, 0);

            const approxUnusedSpace = 1800 - sum;

            if (approxUnusedSpace > 0) {
                const nbColumns = Object.keys(initialWidths).length;

                const unusedSpacePerColumn = approxUnusedSpace / nbColumns;

                Object.keys(initialWidths).forEach(column => {
                    initialWidths[column] += unusedSpacePerColumn;
                });
            }

            return initialWidths;
        }, [columnsDigest(columns)]);

        return { getInitialWidths };
    })();

    const [columnWidths, setColumnWidths] = useState(getInitialWidths);

    useEffectOnValueChange(() => {
        setColumnWidths(getInitialWidths());
    }, [getInitialWidths]);

    const modifiedColumns = useMemo(
        () =>
            columns
                .map(column => ({ column, "width": columnWidths[column.field] }))
                .map(
                    ({ column, width }) =>
                        ({
                            ...column,
                            width,
                            "renderHeader": () => (
                                <ResizableColumnHeader
                                    label={column.field}
                                    width={width}
                                    onResize={({ newWidth }) => {
                                        setColumnWidths(prevWidths => ({
                                            ...prevWidths,
                                            [column.field]: newWidth
                                        }));
                                    }}
                                />
                            )
                        } satisfies GridColDef)
                ),
        [columns, columnWidths]
    );

    const { css, cx } = useStyles();

    return (
        <DataGrid
            {...props}
            classes={{
                ...props.classes,
                "columnHeaderTitleContainerContent": cx(
                    props.classes?.columnHeaderTitleContainerContent,
                    css({
                        "flex": 1
                    })
                ),
                "columnHeader": cx(
                    props.classes?.columnHeader,
                    css({
                        "&:focus, &:focus-within": {
                            "&&&": {
                                "outline": "none"
                            }
                        }
                    })
                )
            }}
            columns={modifiedColumns}
        />
    );
};
