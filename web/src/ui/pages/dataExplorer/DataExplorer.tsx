import { useEffect, useState } from "react";
import { tss } from "tss";
import type { PageRoute } from "./route";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";
import {
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarDensitySelector
} from "@mui/x-data-grid";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { CustomDataGrid } from "./CustomDataGrid";
import { assert, type Equals } from "tsafe/assert";
import { useEvt } from "evt/hooks";
import { exclude } from "tsafe/exclude";
import { UrlInput } from "./UrlInput";
import { PageHeader } from "onyxia-ui/PageHeader";
import { id } from "tsafe/id";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { createUseDebounce } from "powerhooks/useDebounce";

export type Props = {
    route: PageRoute;
    className?: string;
};

const { useDebounce } = createUseDebounce({
    "delay": 1000
});

export default function DataExplorer(props: Props) {
    const { className, route } = props;

    const { classes, cx } = useStyles();

    const { dataExplorer } = useCore().functions;

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

    const [columnWidths, setColumnWidths] = useState(route.params.columnWidths);

    useDebounce(() => {
        routes[route.name]({
            ...route.params,
            columnWidths
        }).replace();
    }, [columnWidths]);

    useEffect(() => {
        setColumnWidths(route.params.columnWidths);
    }, [route.params.columnWidths]);

    const { evtDataExplorer } = useCore().evts;

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

    const { t } = useTranslation({ DataExplorer });

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
                        "source":
                            "https://static.data.gouv.fr/resources/recensement-de-la-population-fichiers-detail-individus-localises-au-canton-ou-ville-2020-1/20231023-122841/fd-indcvi-2020.parquet"
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

                    return (
                        <div className={cx(classes.dataGridWrapper, className)}>
                            <CustomDataGrid
                                columnVisibilityModel={route.params.columnVisibility}
                                onColumnVisibilityModelChange={columnVisibilityModel =>
                                    routes[route.name]({
                                        ...route.params,
                                        "columnVisibility": columnVisibilityModel
                                    }).replace()
                                }
                                onColumnWidthChange={({ field, width }) =>
                                    setColumnWidths(columnWidths => ({
                                        ...columnWidths,
                                        [field]: width
                                    }))
                                }
                                columnWidths={columnWidths}
                                onRowSelectionModelChange={rowSelectionModel => {
                                    const selectedRowIndex = rowSelectionModel[0];

                                    assert(
                                        typeof selectedRowIndex === "number" ||
                                            selectedRowIndex === undefined
                                    );

                                    routes[route.name]({
                                        ...route.params,
                                        "selectedRow": selectedRowIndex
                                    }).replace();
                                }}
                                rowSelectionModel={[
                                    route.params.selectedRow ?? undefined
                                ].filter(exclude(undefined))}
                                rows={rows}
                                columns={columns}
                                disableColumnMenu
                                disableColumnFilter
                                slots={{
                                    "toolbar": CustomToolbar
                                }}
                                loading={isQuerying}
                                paginationMode="server"
                                rowCount={rowCount}
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
                            />
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

function CustomToolbar() {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarDensitySelector />
        </GridToolbarContainer>
    );
}

const useStyles = tss.withName({ DataExplorer }).create(({ theme }) => ({
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
    }
}));

export const { i18n } = declareComponentKeys<
    | "page header title"
    | "page header help title"
    | {
          K: "page header help content";
          P: { demoParquetFileLink: Link };
          R: JSX.Element;
      }
>()({ DataExplorer });
