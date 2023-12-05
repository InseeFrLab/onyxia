import { useMemo, useCallback } from "react";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ResizableColumnHeader } from "./ResizableColumnHeader";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useConst } from "powerhooks";
import memoize from "memoizee";
import { assert } from "tsafe/assert";
import { tss } from "tss";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";

export type Props = React.ComponentProps<typeof DataGrid> & {
    onColumnWidthChange: (params: { field: string; width: number }) => void;
    /** width by column.field */
    columnWidths: Record<string, number>;
};

/**
 * This DataGrid is a wrapper around MUI DataGrid that allows to resize columns
 * and also to copy the content of a cell to the clipboard.
 * It also computes a good default for the initial width of each column.
 */
export function CustomDataGrid(props: Props) {
    const { columns, onColumnWidthChange, columnWidths, ...propsRest } = props;

    const { defaultColumnWidths } = (function useClosure() {
        const getColumnsDigest = useConst(() =>
            memoize(
                (o: typeof columns) =>
                    JSON.stringify(
                        o.map(column => ({
                            "field": column.field,
                            "width": column.width
                        }))
                    ),
                { "max": 1 }
            )
        );

        const getDefaultColumnWidth = useCallback(() => {
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
        }, [getColumnsDigest(columns)]);

        const [defaultColumnWidths, setDefaultColumnWidths] =
            useState(getDefaultColumnWidth);

        useEffectOnValueChange(() => {
            setDefaultColumnWidths(getDefaultColumnWidth());
        }, [getDefaultColumnWidth]);

        return { defaultColumnWidths };
    })();

    const { classes, cx } = useStyles();

    const { modifiedColumns } = (function useClosure() {
        const getColumnWidthsDigest = useConst(() =>
            memoize((o: typeof columnWidths) => JSON.stringify(o), { "max": 1 })
        );

        const modifiedColumns = useMemo(
            () =>
                columns
                    .map(column => ({
                        column,
                        "width":
                            columnWidths[column.field] ??
                            defaultColumnWidths[column.field]
                    }))
                    .map(({ column, width }) => {
                        assert(
                            column.renderCell === undefined,
                            "Cannot override renderCell"
                        );
                        assert(
                            column.renderHeader === undefined,
                            "Cannot override renderHeader"
                        );
                        return {
                            ...column,
                            width,
                            "renderCell": ({ value, hasFocus }) => (
                                <>
                                    <div
                                        className={classes.cell}
                                        role="presentation"
                                        title={value}
                                    >
                                        <span>{value}</span>
                                    </div>
                                    {hasFocus && (
                                        <CopyToClipboardIconButton textToCopy={value} />
                                    )}
                                </>
                            ),
                            "renderHeader": () => (
                                <ResizableColumnHeader
                                    label={column.field}
                                    width={width}
                                    onResize={({ newWidth }) =>
                                        onColumnWidthChange({
                                            "field": column.field,
                                            "width": newWidth
                                        })
                                    }
                                />
                            )
                        } satisfies GridColDef;
                    }),
            [columns, defaultColumnWidths, getColumnWidthsDigest(columnWidths)]
        );

        return { modifiedColumns };
    })();

    const dataGridClasses = useMemo(
        () => ({
            ...props.classes,
            "columnHeaderTitleContainerContent": cx(
                classes.columnHeaderTitleContainerContent,
                props.classes?.columnHeaderTitleContainerContent
            ),
            "columnHeader": cx(classes.columnHeader, props.classes?.columnHeader)
        }),
        [props.classes, cx, classes]
    );

    return (
        <DataGrid {...propsRest} classes={dataGridClasses} columns={modifiedColumns} />
    );
}

const useStyles = tss.withName({ CustomDataGrid }).create({
    "cell": {
        "overflow": "hidden",
        "textOverflow": "ellipsis",
        "whiteSpace": "nowrap",
        "width": "100%"
    },
    "columnHeaderTitleContainerContent": {
        "flex": 1
    },
    "columnHeader": {
        "&:focus, &:focus-within": {
            "&&&": {
                "outline": "none"
            }
        }
    }
});
