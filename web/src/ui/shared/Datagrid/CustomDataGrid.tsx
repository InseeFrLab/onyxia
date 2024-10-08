/* eslint-disable react-refresh/only-export-components */
import { DataGrid, GridClasses, GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { type ComponentProps, memo, useEffect, useMemo } from "react";
import { assert } from "tsafe";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "tss";

export type CustomDataGridProps = ComponentProps<typeof DataGrid>;

export const autosizeOptions = {
    expand: true,
    includeHeaders: true,
    includeOutliers: false
};

export const CustomDataGrid = memo((props: CustomDataGridProps) => {
    const { columns, ...propsRest } = props;
    const { classes, css } = useStyles();
    const apiRef = useGridApiRef();

    const css_const = useConstCallback(css);

    useEffect(() => {
        return apiRef.current.subscribeEvent("columnVisibilityModelChange", () => {
            apiRef.current.autosizeColumns(autosizeOptions);
        });
    }, []);

    const modifiedColumns = useMemo(
        () =>
            columns.map(column => {
                assert(column.renderCell === undefined, "Cannot override renderCell");

                return {
                    ...column,
                    "renderCell": ({ value, hasFocus }) => (
                        <>
                            <div style={{ width: "100%" }}>{value}</div>
                            <CopyToClipboardIconButton
                                textToCopy={value}
                                className={css_const({
                                    visibility: hasFocus ? "visible" : "hidden", //This ensure to preserve space for the icon when cell are auto resized
                                    right: 0
                                })}
                            />
                        </>
                    ),
                    display: "flex"
                } satisfies GridColDef;
            }),
        [columns]
    );

    const dataGridClasses = useMemo(
        () =>
            ({
                ...props.classes,
                "columnHeader": classes.columnHeader,
                "columnSeparator": classes.columnSeparator,
                "iconSeparator": classes.iconSeparator
            }) satisfies Partial<GridClasses>,
        [props.classes, classes]
    );

    return (
        <DataGrid
            {...propsRest}
            apiRef={apiRef}
            classes={dataGridClasses}
            columns={modifiedColumns}
            autosizeOnMount
            autosizeOptions={autosizeOptions}
        />
    );
});

const useStyles = tss.withName({ CustomDataGrid }).create(({ theme }) => ({
    "columnHeader": {
        "&:focus, &:focus-within": {
            "&&": {
                outline: "none"
            }
        }
    },
    "columnSeparator": { "&&&&&": { opacity: "1" } }, //Ensures the column separator remains visible (opacity 1) when a column header is selected. By default, MUI reduces the opacity to 0 because an outline is applied to the selected column header
    "iconSeparator": {
        color: `${theme.colors.useCases.typography.textDisabled} !important`
    }
}));
