/* eslint-disable react-refresh/only-export-components */
import {
    DataGrid,
    type GridValidRowModel,
    type GridClasses,
    type GridColDef,
    type GridAutosizeOptions
} from "@mui/x-data-grid";
import { type ComponentProps, useMemo } from "react";
import { tss } from "tss";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CustomNoRowsOverlay } from "./CustomNoRowsOverlay";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";

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
                columnSeparator: classes.columnSeparator,
                iconSeparator: classes.iconSeparator
            }) satisfies Partial<GridClasses>,
        [props.classes, classes]
    );

    const modifiedColumns = useMemo(
        () =>
            shouldAddCopyToClipboardInCell
                ? columns.map(column => {
                      const originalRenderCell = column.renderCell;
                      return {
                          ...column,
                          renderCell: params => (
                              <>
                                  {originalRenderCell ? (
                                      originalRenderCell(params)
                                  ) : (
                                      <span>{params.formattedValue}</span>
                                  )}
                                  <CopyToClipboardIconButton
                                      textToCopy={params.formattedValue}
                                      className={css({
                                          visibility: params.hasFocus
                                              ? "visible"
                                              : "hidden", // Ensure space is preserved for the icon
                                          right: 0
                                      })}
                                  />
                              </>
                          ),
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

const { i18n } = declareComponentKeys<
    | "empty directory"
    | "label rows per page"
    | { K: "label rows count"; P: { count: number }; R: string }
>()({ CustomDataGrid });

export type I18n = typeof i18n;
const useStyles = tss.withName({ CustomDataGrid }).create(({ theme }) => ({
    columnSeparator: { "&&&&&&&": { opacity: "1" } }, //Ensures the column separator remains visible (opacity 1) when a column header is selected. By default, MUI reduces the opacity to 0 because an outline is applied to the selected column header
    iconSeparator: {
        "&&": { color: theme.colors.useCases.typography.textDisabled }
    }
}));
