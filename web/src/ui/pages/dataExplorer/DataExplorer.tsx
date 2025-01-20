import { useEffect, useMemo, useState } from "react";
import { tss } from "tss";
import type { PageRoute } from "./route";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { assert } from "tsafe/assert";
import { UrlInput } from "./UrlInput";
import { PageHeader } from "onyxia-ui/PageHeader";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { useOnOpenBrowserSearch } from "ui/tools/useOnOpenBrowserSearch";
import { env } from "env";
import { autosizeOptions, CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import { SlotsDataGridToolbar } from "./SlotsDataGridToolbar";
import { exclude } from "tsafe/exclude";
import { useApplyClassNameToParent } from "ui/tools/useApplyClassNameToParent";
import { type GridColDef, useGridApiRef } from "@mui/x-data-grid";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function DataExplorer(props: Props) {
    const { className, route } = props;

    const { dataExplorer } = useCore().functions;
    const { t } = useTranslation({ DataExplorer });

    const apiRef = useGridApiRef();

    useEffect(() => {
        dataExplorer.initialize({
            sourceUrl: route.params.source,
            rowsPerPage: route.params.rowsPerPage,
            page: route.params.page,
            selectedRowIndex: route.params.selectedRow,
            columnVisibility: route.params.columnVisibility
        });
    }, [route.params.source]);

    const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(true);

    useOnOpenBrowserSearch(() => {
        console.log(
            "Disabling data grid virtualization to allow search on all loaded rows"
        );
        setIsVirtualizationEnabled(false);
    });

    const {
        queryParams,
        extraRestorableStates,
        rows,
        columns,
        rowCount,
        errorMessage,
        isQuerying
    } = useCoreState("dataExplorer", "main");

    const modifiedColumns = useMemo(() => {
        if (columns === undefined) return undefined;
        return columns.map(
            column =>
                ({
                    field: column.name,
                    sortable: false,
                    renderHeader: () => (
                        <Text typo="body 1">
                            {column.name}
                            <Text
                                typo="caption"
                                className={classes.dataGridColumnHeaderType}
                            >
                                {column.rowType}
                            </Text>
                        </Text>
                    ),
                    headerAlign: "left",
                    type: (() => {
                        switch (column.type) {
                            case "bigint":
                            case "binary":
                                return "string";
                            default:
                                return column.type;
                        }
                    })()
                }) satisfies GridColDef
        );
    }, [columns]);

    useEffect(() => {
        if (columns) {
            apiRef.current.autosizeColumns(autosizeOptions);
        }
    }, [columns]);

    useEffectOnValueChange(() => {
        if (queryParams === undefined) {
            routes[route.name]().replace();
            return;
        }

        const { selectedRowIndex: selectedRow, columnVisibility } =
            extraRestorableStates || {};

        routes[route.name]({
            ...route.params,
            source: queryParams.sourceUrl,
            page: queryParams.page,
            rowsPerPage: queryParams.rowsPerPage,
            selectedRow,
            columnVisibility
        }).replace();
    }, [queryParams, extraRestorableStates]);

    const { classes, cx } = useStyles();

    // Theres a bug in MUI classes.panel does not apply so have to apply the class manually
    const { childrenClassName: dataGridPanelWrapperRefClassName } =
        useApplyClassNameToParent({
            parentSelector: ".MuiDataGrid-panel",
            className: classes.dataGridPanel
        });

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    helpMiddle: classes.pageHeaderHelpMiddle
                }}
                mainIcon={getIconUrlByName("DocumentScanner")}
                title={t("page header title")}
                helpTitle={t("page header help title")}
                helpContent={t("page header help content", {
                    demoParquetFileLink: routes[route.name]({
                        source: env.SAMPLE_DATASET_URL
                    }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
                titleCollapseParams={{
                    behavior: "controlled",
                    isCollapsed: rows !== undefined
                }}
                helpCollapseParams={{
                    behavior: "controlled",
                    isCollapsed: rows !== undefined
                }}
            />
            <UrlInput
                className={classes.urlInput}
                onUrlChange={value => {
                    dataExplorer.updateDataSource({ sourceUrl: value });
                }}
                // NOTE: So that we show the URL in the search bar while it's being queried
                url={
                    queryParams === undefined
                        ? (route.params.source ?? "")
                        : queryParams.sourceUrl
                }
                getIsValidUrl={url =>
                    dataExplorer.getIsValidSourceUrl({
                        sourceUrl: url
                    })
                }
            />
            <div className={classes.mainArea}>
                {(() => {
                    if (errorMessage !== undefined) {
                        return (
                            <Alert className={classes.errorAlert} severity="error">
                                {errorMessage}
                            </Alert>
                        );
                    }

                    if (rows === undefined || modifiedColumns === undefined) {
                        if (!isQuerying) {
                            return null;
                        }

                        return (
                            <div className={cx(classes.initializing, className)}>
                                <CircularProgress size={70} />
                            </div>
                        );
                    }

                    assert(queryParams.page !== undefined);
                    assert(queryParams.rowsPerPage !== undefined);

                    return (
                        <div className={cx(classes.dataGridWrapper, className)}>
                            <CustomDataGrid
                                apiRef={apiRef}
                                shouldAddCopyToClipboardInCell
                                classes={{
                                    panelWrapper: cx(
                                        dataGridPanelWrapperRefClassName,
                                        classes.dataGridPanelWrapper
                                    ),
                                    panelFooter: classes.dataGridPanelFooter,
                                    menu: classes.dataGridMenu
                                }}
                                slots={{ toolbar: SlotsDataGridToolbar }}
                                disableVirtualization={!isVirtualizationEnabled}
                                columnVisibilityModel={
                                    extraRestorableStates.columnVisibility
                                }
                                onColumnVisibilityModelChange={columnVisibilityModel =>
                                    dataExplorer.updateColumnVisibility({
                                        columnVisibility: columnVisibilityModel
                                    })
                                }
                                onRowSelectionModelChange={rowSelectionModel => {
                                    const selectedRowIndex = rowSelectionModel[0];

                                    assert(
                                        typeof selectedRowIndex === "number" ||
                                            selectedRowIndex === undefined
                                    );

                                    dataExplorer.updateRowSelected({ selectedRowIndex });
                                }}
                                rowSelectionModel={[
                                    extraRestorableStates.selectedRowIndex ?? undefined
                                ].filter(exclude(undefined))}
                                rows={rows}
                                columns={modifiedColumns}
                                disableColumnMenu
                                loading={isQuerying}
                                paginationMode="server"
                                rowCount={rowCount ?? 999999999}
                                pageSizeOptions={(() => {
                                    const pageSizeOptions = [25, 50, 100];
                                    assert(
                                        pageSizeOptions.includes(queryParams.rowsPerPage)
                                    );
                                    return pageSizeOptions;
                                })()}
                                paginationModel={{
                                    page: queryParams.page - 1,
                                    pageSize: queryParams.rowsPerPage
                                }}
                                onPaginationModelChange={({ page, pageSize }) => {
                                    dataExplorer.updatePaginationModel({
                                        page: page + 1,
                                        rowsPerPage: pageSize
                                    });
                                }}
                            />
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
const useStyles = tss.withName({ DataExplorer }).create(({ theme }) => ({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    },
    pageHeaderHelpMiddle: {
        "& > h5": {
            marginBottom: theme.spacing(2)
        }
    },
    initializing: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    },
    urlInput: {
        marginBottom: theme.spacing(4)
    },
    errorAlert: {
        marginTop: theme.spacing(4),
        maxWidth: 950
    },
    mainArea: {
        flex: 1,
        overflow: "hidden"
    },
    dataGridWrapper: {
        width: "100%",
        height: "100%",
        overflowY: "hidden",
        overflowX: "auto"
    },
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

const { i18n } = declareComponentKeys<
    | "page header title"
    | "page header help title"
    | {
          K: "page header help content";
          P: { demoParquetFileLink: Link };
          R: JSX.Element;
      }
    | "column"
    | "density"
    | "download file"
    | "resize table"
>()({ DataExplorer });
export type I18n = typeof i18n;
