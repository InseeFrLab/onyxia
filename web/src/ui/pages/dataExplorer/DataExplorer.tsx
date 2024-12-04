import { useEffect, useState } from "react";
import { tss } from "tss";
import { DEFAULT_QUERY_PARAMS, type PageRoute } from "./route";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { assert, type Equals } from "tsafe/assert";
import { UrlInput } from "./UrlInput";
import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { useOnOpenBrowserSearch } from "ui/tools/useOnOpenBrowserSearch";
import { env } from "env";
import { CustomDataGrid } from "ui/shared/Datagrid/CustomDataGrid";
import { SlotsDataGridToolbar } from "./SlotsDataGridToolbar";
import { exclude } from "tsafe/exclude";
import { useApplyClassNameToParent } from "ui/tools/useApplyClassNameToParent";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function DataExplorer(props: Props) {
    const { className, route } = props;

    const { dataExplorer } = useCore().functions;
    const { t } = useTranslation({ DataExplorer });

    useEffect(() => {
        dataExplorer.initialize({
            sourceUrl: route.params.source ?? "",
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

    useEffect(() => {
        if (queryParams === undefined) {
            routes[route.name]().replace();
            return;
        }

        routes[route.name]({
            ...route.params,
            source: queryParams.sourceUrl,
            page: queryParams.page,
            rowsPerPage: queryParams.rowsPerPage,
            selectedRow: extraRestorableStates.selectedRowIndex,
            columnVisibility: extraRestorableStates.columnVisibility
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
                getIsValidUrl={url =>
                    dataExplorer.getIsValidSourceUrl({
                        sourceUrl: url
                    })
                }
                onUrlChange={value => {
                    dataExplorer.updateDataSource({
                        queryParams: {
                            sourceUrl: value,
                            rowsPerPage: DEFAULT_QUERY_PARAMS.rowsPerPage,
                            page: DEFAULT_QUERY_PARAMS.page
                        },
                        shouldVerifyUrl: false
                    });
                }}
                url={queryParams?.sourceUrl ?? DEFAULT_QUERY_PARAMS.source}
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

                    if (rows === undefined) {
                        if (!isQuerying) {
                            return null;
                        }

                        return (
                            <div className={cx(classes.initializing, className)}>
                                <CircularProgress size={70} />
                            </div>
                        );
                    }

                    return (
                        <div className={cx(classes.dataGridWrapper, className)}>
                            <CustomDataGrid
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
                                columns={columns}
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
