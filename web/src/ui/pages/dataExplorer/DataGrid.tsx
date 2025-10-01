import { useEffect, useMemo, useState } from "react";
import { tss } from "tss";
import { getCoreSync, useCoreState } from "core";
import { assert } from "tsafe/assert";
import { Text } from "onyxia-ui/Text";
import { useOnOpenBrowserSearch } from "ui/tools/useOnOpenBrowserSearch";
import { autosizeOptions, CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import { SlotsDataGridToolbar } from "./SlotsDataGridToolbar";
import { useApplyClassNameToParent } from "ui/tools/useApplyClassNameToParent";
import { type GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { id } from "tsafe/id";
import { useConstCallback } from "powerhooks/useConstCallback";

export function DataGrid(params: { className?: string }) {
    const { className } = params;

    const {
        functions: { dataExplorer }
    } = getCoreSync();

    const { isQuerying, dataGridView } = useCoreState("dataExplorer", "view");

    assert(dataGridView !== undefined);
    assert(!dataGridView.isErrored);

    const {
        columns,
        rows,
        rowIdByRowIndex,
        columnVisibility,
        selectedRowId,
        rowCount,
        page,
        rowsPerPage
    } = dataGridView;

    const apiRef = useGridApiRef();

    const modifiedColumns = useMemo(
        () =>
            dataGridView.columns.map(column =>
                id<GridColDef>({
                    field: column.name,
                    sortable: false,
                    renderHeader: () => (
                        <Text typo="body 1">
                            {column.name}
                            <Text
                                typo="caption"
                                className={classes.dataGridColumnHeaderType}
                            >
                                {column.displayType}
                            </Text>
                        </Text>
                    ),
                    headerAlign: "left",
                    type: (() => {
                        switch (column.type) {
                            case "binary":
                            case "time":
                                return "string";
                            default:
                                return column.type;
                        }
                    })(),
                    align: ["bigint", "number"].includes(column.type) ? "right" : "left"
                })
            ),
        [columns]
    );

    useEffect(() => {
        if (columns) {
            apiRef.current.autosizeColumns(autosizeOptions);
        }
    }, [columns]);

    const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(true);

    useOnOpenBrowserSearch(() => {
        console.log(
            "Disabling data grid virtualization to allow search on all loaded rows"
        );
        setIsVirtualizationEnabled(false);
    });

    const { classes, cx } = useStyles();

    // Theres a bug in MUI classes.panel does not apply so have to apply the class manually
    const { childrenClassName: dataGridPanelWrapperRefClassName } =
        useApplyClassNameToParent({
            parentSelector: ".MuiDataGrid-panel",
            className: classes.dataGridPanel
        });

    // NOTE: Here it's important to have useConstCallback, MUI do not
    // always call the last reference of the callback.
    const getRowId = useConstCallback((row: Record<string, unknown>) => {
        const rowIndex = rows.indexOf(row);
        assert(rowIndex !== -1);
        const rowId = rowIdByRowIndex[rowIndex];
        assert(rowId !== undefined);
        return rowId;
    });

    return (
        <CustomDataGrid
            apiRef={apiRef}
            shouldAddCopyToClipboardInCell
            classes={{
                root: className,
                panelWrapper: cx(
                    dataGridPanelWrapperRefClassName,
                    classes.dataGridPanelWrapper
                ),
                panelFooter: classes.dataGridPanelFooter,
                menu: classes.dataGridMenu
            }}
            slots={{ toolbar: SlotsDataGridToolbar }}
            disableVirtualization={!isVirtualizationEnabled}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={columnVisibilityModel =>
                dataExplorer.updateColumnVisibility({
                    columnVisibility: columnVisibilityModel
                })
            }
            onRowSelectionModelChange={rowSelectionModel => {
                const selectedRowId = rowSelectionModel[0];

                assert(typeof selectedRowId === "string" || selectedRowId === undefined);

                dataExplorer.updateSelectedRowId({ selectedRowId });
            }}
            rowSelectionModel={selectedRowId === undefined ? [] : [selectedRowId]}
            rows={rows}
            getRowId={getRowId}
            columns={modifiedColumns}
            disableColumnMenu
            loading={isQuerying}
            paginationMode="server"
            rowCount={rowCount ?? 999999999}
            pageSizeOptions={(() => {
                const pageSizeOptions = [25, 50, 100];
                assert(pageSizeOptions.includes(rowsPerPage));
                return pageSizeOptions;
            })()}
            paginationModel={{
                page: page - 1,
                pageSize: rowsPerPage
            }}
            onPaginationModelChange={({ page, pageSize }) => {
                dataExplorer.updatePaginationModel({
                    page: page + 1,
                    rowsPerPage: pageSize
                });
            }}
        />
    );
}

const useStyles = tss.withName({ DataGrid }).create(({ theme }) => ({
    dataGridPanel: {
        overflow: "hidden",
        borderRadius: 8,
        boxShadow: theme.shadows[1],
        "&:hover": {
            boxShadow: theme.shadows[6]
        }
    },
    dataGridPanelWrapper: {
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        padding: theme.spacing(2)
    },
    dataGridPanelFooter: {
        "& .MuiButton-root": {
            textTransform: "unset"
        }
    },
    dataGridMenu: {
        "& .MuiMenuItem-root": {
            "&.Mui-selected": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            },
            "& svg": {
                color: theme.colors.useCases.typography.textPrimary
            },
            "&:hover": {
                backgroundColor: theme.colors.palette.focus.light
            }
        }
    },
    dataGridColumnHeaderType: {
        fontStyle: "italic"
    }
}));
