import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { type ComponentProps, memo, useMemo } from "react";
import { assert } from "tsafe";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CustomDataGridToolbar } from "./CustomDataGridToolbar";
import { tss } from "tss";

export type CustomDataGridProps = ComponentProps<typeof DataGrid> & {};

export const CustomDataGrid = memo((props: CustomDataGridProps) => {
    const { columns, ...propsRest } = props;
    console.log(propsRest.rows);
    const { classes } = useStyles();
    const modifiedColumns = useMemo(
        () =>
            columns.map(column => {
                assert(column.renderCell === undefined, "Cannot override renderCell");

                return {
                    ...column,
                    "renderCell": ({ value, hasFocus }) => (
                        <>
                            {value}
                            {hasFocus && <CopyToClipboardIconButton textToCopy={value} />}
                        </>
                    ),
                    cellClassName: classes.cell
                } satisfies GridColDef;
            }),
        [columns]
    );
    return (
        <DataGrid
            {...propsRest}
            slots={{
                "toolbar": CustomDataGridToolbar
            }}
            columns={modifiedColumns}
        />
    );
});

const useStyles = tss.withName({ CustomDataGrid }).create({
    "cell": {
        display: "flex",
        justifyContent: "space-between !important" //.MuiDataGrid-cell--textLeft flex-start
    }
});
