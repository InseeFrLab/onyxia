import { useEffect, useState } from "react";
import { tss, useStyles as useClasslessStyles } from "tss";
import type { PageRoute } from "./route";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";
import {
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarDensitySelector,
    DataGrid,
    useGridApiRef,
    GridToolbarProps,
    GridToolbar,
    useGridApiContext,
    gridDensitySelector
} from "@mui/x-data-grid";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { assert, type Equals } from "tsafe/assert";
import { useEvt } from "evt/hooks";
import { exclude } from "tsafe/exclude";
import { UrlInput } from "./UrlInput";
import { PageHeader } from "onyxia-ui/PageHeader";
import { id } from "tsafe/id";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { useOnOpenBrowserSearch } from "ui/tools/useOnOpenBrowserSearch";
import { ButtonBar } from "onyxia-ui/ButtonBar";
import { env } from "env";
import { CustomDataGridToolbar } from "./CustomDataGrid/CustomDataGridToolbar";
import { Button } from "onyxia-ui/Button";
import { CustomDataGrid } from "./CustomDataGrid";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function DataExplorer(props: Props) {
    const { className, route } = props;

    const { dataExplorer } = useCore().functions;
    const { t } = useTranslation({ DataExplorer });

    const apiRef = useGridApiRef();

    console.log(route.params);
    useEffect(() => {
        dataExplorer.setQueryParamsAndExtraRestorableStates({
            "queryParams": {
                "sourceUrl": route.params.source ?? "",
                "rowsPerPage": route.params.rowsPerPage,
                "page": route.params.page
            },
            "extraRestorableStates": {
                "columnWidths": route.params.columnWidths,
                "selectedRowIndex": route.params.selectedRow,
                "columnVisibility": route.params.columnVisibility
            }
        });
    }, [route]);

    const { evtDataExplorer } = useCore().evts;

    const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState(true);

    useOnOpenBrowserSearch(() => {
        console.log(
            "Disabling data grid virtualization to allow search on all loaded rows"
        );
        setIsVirtualizationEnabled(false);
    });

    useEvt(
        ctx => {
            evtDataExplorer.$attach(
                eventData =>
                    eventData.actionName === "restoreState" ? [eventData] : null,
                ctx,
                ({ queryParams, extraRestorableStates }) => {
                    const { sourceUrl, rowsPerPage, page, ...rest1 } = queryParams;
                    assert<Equals<typeof rest1, {}>>();
                    const { columnWidths, selectedRowIndex, columnVisibility, ...rest2 } =
                        extraRestorableStates;
                    assert<Equals<typeof rest2, {}>>();

                    routes[route.name]({
                        ...route.params,
                        page,
                        rowsPerPage,
                        "source": sourceUrl,
                        "selectedRow": selectedRowIndex,
                        columnWidths,
                        columnVisibility
                    }).replace();
                }
            );
        },
        [evtDataExplorer]
    );

    const { rows, columns, rowCount, errorMessage, isQuerying } = useCoreState(
        "dataExplorer",
        "main"
    );

    const { classes, cx } = useStyles({
        "rowsToFrom":
            rows === undefined || rowCount !== undefined
                ? undefined
                : {
                      "from": (route.params.page - 1) * route.params.rowsPerPage + 1,
                      "to":
                          (route.params.page - 1) * route.params.rowsPerPage + rows.length
                  }
    });

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    "helpMiddle": classes.pageHeaderHelpMiddle
                }}
                mainIcon={id<MuiIconComponentName>("DocumentScanner")}
                title={t("page header title")}
                helpTitle={t("page header help title")}
                helpContent={t("page header help content", {
                    "demoParquetFileLink": routes[route.name]({
                        "source": env.SAMPLE_DATASET_URL
                    }).link
                })}
                helpIcon={id<MuiIconComponentName>("SentimentSatisfied")}
                titleCollapseParams={{
                    "behavior": "controlled",
                    "isCollapsed": rows !== undefined
                }}
                helpCollapseParams={{
                    "behavior": "controlled",
                    "isCollapsed": rows !== undefined
                }}
            />
            <UrlInput
                className={classes.urlInput}
                getIsValidUrl={url =>
                    dataExplorer.getIsValidSourceUrl({
                        "sourceUrl": url
                    })
                }
                onUrlChange={value => {
                    routes[route.name]({
                        "source": value
                    }).replace();
                }}
                url={route.params.source ?? ""}
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

                    const autosizeOptions = {
                        expand: true,
                        includeHeaders: true,
                        includeOutliers: true
                    };

                    console.log("render");
                    return (
                        <div className={cx(classes.dataGridWrapper, className)}>
                            <CustomDataGrid
                                apiRef={apiRef}
                                // classes={{
                                //     "panelWrapper": cx(
                                //         //dataGridPanelWrapperRefClassName,
                                //         classes.dataGridPanelWrapper
                                //     ),
                                //     "panelFooter": classes.dataGridPanelFooter,
                                //     "menu": classes.dataGridMenu,
                                //     "footerContainer": classes.dataGridFooterContainer
                                // }}
                                disableVirtualization={!isVirtualizationEnabled}
                                //columnVisibilityModel={route.params.columnVisibility}
                                // onColumnVisibilityModelChange={columnVisibilityModel =>
                                //     routes[route.name]({
                                //         ...route.params,
                                //         "columnVisibility": columnVisibilityModel
                                //     }).replace()
                                // }
                                // onRowSelectionModelChange={rowSelectionModel => {
                                //     const selectedRowIndex = rowSelectionModel[0];

                                //     assert(
                                //         typeof selectedRowIndex === "number" ||
                                //             selectedRowIndex === undefined
                                //     );

                                //     routes[route.name]({
                                //         ...route.params,
                                //         "selectedRow": selectedRowIndex
                                //     }).replace();
                                // }}
                                // rowSelectionModel={[
                                //     route.params.selectedRow ?? undefined
                                // ].filter(exclude(undefined))}
                                rows={rows}
                                columns={columns}
                                disableColumnMenu
                                loading={isQuerying}
                                paginationMode="server"
                                rowCount={rowCount ?? 999999999}
                                pageSizeOptions={(() => {
                                    const pageSizeOptions = [25, 50, 100];

                                    assert(
                                        pageSizeOptions.includes(route.params.rowsPerPage)
                                    );

                                    return pageSizeOptions;
                                })()}
                                paginationModel={{
                                    "page": route.params.page - 1,
                                    "pageSize": route.params.rowsPerPage
                                }}
                                onPaginationModelChange={({ page, pageSize }) =>
                                    routes[route.name]({
                                        ...route.params,
                                        "rowsPerPage": pageSize,
                                        "page": page + 1
                                    }).replace()
                                }
                                autosizeOnMount={true}
                                autosizeOptions={autosizeOptions}
                            />
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
const useStyles = tss
    .withName({ DataExplorer })
    .withParams<{
        rowsToFrom:
            | {
                  from: number;
                  to: number;
              }
            | undefined;
    }>()
    .create(({ theme, rowsToFrom }) => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column"
        },
        "pageHeaderHelpMiddle": {
            "& > h5": {
                "marginBottom": theme.spacing(2)
            }
        },
        "initializing": {
            "display": "flex",
            "justifyContent": "center",
            "alignItems": "center",
            "height": "100%"
        },
        "urlInput": {
            "marginBottom": theme.spacing(4)
        },
        "errorAlert": {
            "marginTop": theme.spacing(4),
            "maxWidth": 950
        },
        "mainArea": {
            "flex": 1,
            "overflow": "hidden"
        },
        "dataGridWrapper": {
            "width": "100%",
            "height": "100%",
            "overflowY": "hidden",
            "overflowX": "auto"
        },
        // "dataGridPanel": {
        //     "overflow": "hidden",
        //     "borderRadius": 8,
        //     "boxShadow": theme.shadows[1],
        //     "&:hover": {
        //         "boxShadow": theme.shadows[6]
        //     }
        // },
        "dataGridPanelWrapper": {
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "padding": theme.spacing(2)
        },
        "dataGridPanelFooter": {
            "& .MuiButton-root": {
                "textTransform": "unset"
            }
        },
        "dataGridMenu": {
            "& .MuiMenuItem-root": {
                "&.Mui-selected": {
                    "backgroundColor": theme.colors.useCases.surfaces.surface2
                },
                "& svg": {
                    "color": theme.colors.useCases.typography.textPrimary
                },
                "&:hover": {
                    "backgroundColor": theme.colors.palette.focus.light
                }
            }
        },
        "dataGridFooterContainer": {
            "& .MuiTablePagination-displayedRows":
                rowsToFrom === undefined
                    ? {}
                    : {
                          "&": {
                              "fontSize": 0,
                              "width": 50,
                              "position": "relative"
                          },
                          "&::after": {
                              "content": `"${rowsToFrom.from}-${rowsToFrom.to}"`,
                              "fontSize": theme.typography.rootFontSizePx * 0.85,
                              "color": theme.colors.useCases.typography.textPrimary,
                              "position": "absolute",
                              "right": 0,
                              "top": 0
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
>()({ DataExplorer });
export type I18n = typeof i18n;
