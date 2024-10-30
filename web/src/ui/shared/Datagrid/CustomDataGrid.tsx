/* eslint-disable react-refresh/only-export-components */
import {
    DataGrid,
    type GridValidRowModel,
    type GridClasses,
    type GridColDef
} from "@mui/x-data-grid";
import { type ComponentProps, useMemo } from "react";
import { tss } from "tss";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CustomNoRowsOverlay } from "./CustomNoRowsOverlay";

export type CustomDataGridProps<R extends GridValidRowModel = any> = ComponentProps<
    typeof DataGrid<R>
> & {
    /**
     * Whether to add copy-to-clipboard functionality in cells.
     * @default false
     */
    shouldAddCopyToClipboardInCell?: boolean;
};

export const autosizeOptions = {
    expand: true,
    includeHeaders: true,
    includeOutliers: false
};

export const CustomDataGrid = <R extends GridValidRowModel = any>(
    props: CustomDataGridProps<R>
) => {
    const { classes, css } = useStyles();
    const {
        columns,
        shouldAddCopyToClipboardInCell = false,
        slots,
        ...propsRest
    } = props;

    const dataGridClasses = useMemo(
        () =>
            ({
                ...props.classes,
                "columnSeparator": classes.columnSeparator,
                "iconSeparator": classes.iconSeparator
            }) satisfies Partial<GridClasses>,
        [props.classes, classes]
    );

    const modifiedColumns = useMemo(
        () =>
            shouldAddCopyToClipboardInCell
                ? columns.map(
                      column =>
                          ({
                              ...column,
                              "renderCell": ({ value, hasFocus }) => (
                                  <>
                                      <div style={{ width: "100%" }}>{value}</div>
                                      <CopyToClipboardIconButton
                                          textToCopy={value}
                                          className={css({
                                              visibility: hasFocus ? "visible" : "hidden", //This ensure to preserve space for the icon when cell are auto resized
                                              right: 0
                                          })}
                                      />
                                  </>
                              ),
                              display: "flex"
                          }) satisfies GridColDef
                  )
                : columns,
        [columns, shouldAddCopyToClipboardInCell]
    );

    return (
        <DataGrid<R>
            {...propsRest}
            slots={{ "noRowsOverlay": CustomNoRowsOverlay, ...slots }}
            columns={modifiedColumns}
            classes={dataGridClasses}
            autosizeOnMount
            autosizeOptions={autosizeOptions}
        />
    );
};

const useStyles = tss.withName({ CustomDataGrid }).create(({ theme }) => ({
    "columnSeparator": { "&&&&&": { opacity: "1" } }, //Ensures the column separator remains visible (opacity 1) when a column header is selected. By default, MUI reduces the opacity to 0 because an outline is applied to the selected column header
    "iconSeparator": {
        "&&": { color: theme.colors.useCases.typography.textDisabled }
    }
}));
