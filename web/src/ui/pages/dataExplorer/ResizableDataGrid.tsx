import { useMemo } from "react";
import { useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ResizableColumnHeader } from "./ResizableColumnHeader";
import { useStyles } from "tss";

export const ResizableDataGrid: typeof DataGrid = ({ columns, ...props }) => {
    const [columnWidths, setColumnWidths] = useState(() => {
        const initialWidths: Record<string, number> = {};
        columns.forEach(column => {
            initialWidths[column.field] = column.width ?? column.field.length * 15;
        });
        return initialWidths;
    });

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
                "columnHeader": css({
                    "&:focus, &:focus-within": {
                        "&&&": {
                            "outline": "none"
                        }
                    }
                })
            }}
            columns={modifiedColumns}
        />
    );
};
