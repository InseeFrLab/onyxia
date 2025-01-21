/* eslint-disable react-refresh/only-export-components */
import {
    DataGrid,
    GridBooleanCell,
    type GridValidRowModel,
    type GridClasses,
    type GridColDef,
    type GridAutosizeOptions,
    type GridRenderCellParams
} from "@mui/x-data-grid";
import { type ComponentProps, useMemo } from "react";
import { tss } from "tss";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CustomNoRowsOverlay } from "./CustomNoRowsOverlay";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { type Css } from "tss-react";

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
} satisfies GridAutosizeOptions;

export const CustomDataGrid = <R extends GridValidRowModel = any>(
    props: CustomDataGridProps<R>
) => {
    const { classes, css } = useStyles();

    const { t } = useTranslation({ CustomDataGrid });
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
                iconSeparator: classes.iconSeparator
            }) satisfies Partial<GridClasses>,
        [props.classes, classes]
    );

    const modifiedColumns = useMemo(
        () =>
            shouldAddCopyToClipboardInCell
                ? columns.map(column => {
                      return {
                          ...column,
                          renderCell: customCellRendererFactory({
                              renderCell: column.renderCell,
                              css,
                              type: column.type
                          }),

                          display: "flex"
                      } satisfies GridColDef;
                  })
                : columns,
        [columns, shouldAddCopyToClipboardInCell]
    );

    return (
        <DataGrid<R>
            {...propsRest}
            slots={{
                noRowsOverlay: CustomNoRowsOverlay,
                ...slots
            }}
            slotProps={{}}
            columns={modifiedColumns}
            classes={dataGridClasses}
            autosizeOnMount
            autosizeOptions={propsRest.autosizeOptions ?? autosizeOptions}
            localeText={{
                MuiTablePagination: {
                    labelRowsPerPage: t("label rows per page")
                },
                footerRowSelected: count => t("label rows count", { count })
            }}
        />
    );
};

function customCellRendererFactory(params: {
    css: Css;
    renderCell: GridColDef["renderCell"];
    type: GridColDef["type"];
}): (gridCellParams: GridRenderCellParams) => JSX.Element {
    const { renderCell, css, type } = params;

    return function (gridCellParams: GridRenderCellParams): JSX.Element {
        return (
            <>
                {renderCell ? (
                    renderCell(gridCellParams)
                ) : (
                    <>
                        {type === "boolean" ? (
                            <GridBooleanCell {...gridCellParams} />
                        ) : (
                            gridCellParams.formattedValue
                        )}
                    </>
                )}
                <CopyToClipboardIconButton
                    textToCopy={gridCellParams.formattedValue}
                    className={css({
                        visibility: gridCellParams.hasFocus ? "visible" : "hidden", // Ensure space is preserved for the icon
                        right: 0
                    })}
                />
            </>
        );
    };
}
const { i18n } = declareComponentKeys<
    | "empty directory"
    | "label rows per page"
    | { K: "label rows count"; P: { count: number }; R: string }
>()({ CustomDataGrid });

export type I18n = typeof i18n;
const useStyles = tss.withName({ CustomDataGrid }).create(({ theme }) => ({
    iconSeparator: {
        "&&&&": { color: theme.colors.useCases.typography.textDisabled }
    }
}));
