/* eslint-disable react-refresh/only-export-components */
import { DataGrid, GridClasses, GridColDef } from "@mui/x-data-grid";
import { type ComponentProps, memo, useMemo } from "react";
import { assert } from "tsafe";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { tss } from "tss";

export type CustomDataGridProps = ComponentProps<typeof DataGrid> & {};

export const autosizeOptions = {
    expand: true,
    includeHeaders: true,
    includeOutliers: true
};

export const CustomDataGrid = memo((props: CustomDataGridProps) => {
    const { columns, ...propsRest } = props;
    const { classes, css } = useStyles();
    const modifiedColumns = useMemo(
        () =>
            columns.map(column => {
                assert(column.renderCell === undefined, "Cannot override renderCell");

                return {
                    ...column,
                    "renderCell": ({ value, hasFocus }) => (
                        <>
                            {value}
                            <CopyToClipboardIconButton
                                textToCopy={value}
                                className={css({
                                    visibility: hasFocus ? "visible" : "hidden" //This ensure to preserve space for the icon when cell are auto resized
                                })}
                            />
                        </>
                    ),
                    cellClassName: classes.cell
                } satisfies GridColDef;
            }),
        [columns]
    );

    const dataGridClasses = useMemo(
        () =>
            ({
                ...props.classes,
                "columnHeader": classes.columnHeader,
                "columnSeparator": classes.columnSeparator
            }) satisfies Partial<GridClasses>,
        [props.classes, classes]
    );

    return (
        <DataGrid
            {...propsRest}
            classes={dataGridClasses}
            columns={modifiedColumns}
            autosizeOnMount={true}
            autosizeOptions={autosizeOptions}
        />
    );
});

const useStyles = tss.withName({ CustomDataGrid }).create(() => ({
    "cell": {
        display: "flex",
        justifyContent: "space-between !important"
    },
    "columnHeader": {
        "&:focus, &:focus-within": {
            outline: "none !important"
        }
    },
    "columnSeparator": { opacity: "1 !important" } //Ensures the column separator remains visible (opacity 1) when a column header is selected. By default, MUI reduces the opacity to 0 because an outline is applied to the selected column header
}));
