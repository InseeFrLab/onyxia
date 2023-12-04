import { useEffect } from "react";
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

export type Props = {
    route: PageRoute;
    className?: string;
};

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

    return (
        <div className={cx(classes.root, className)}>
            <UrlInput
                className={classes.urlInput}
                getIsValidUrl={url =>
                    dataExplorer.getIsValidSourceUrl({
                        "sourceUrl": url
                    })
                }
                onUrlChange={value => {
                    routes[route.name]({
                        ...route.params,
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
                                disableVirtualization
                                columnVisibilityModel={route.params.columnVisibility}
                                onColumnVisibilityModelChange={columnVisibilityModel =>
                                    routes[route.name]({
                                        ...route.params,
                                        "columnVisibility": columnVisibilityModel
                                    }).replace()
                                }
                                onColumnWidthChange={({ field, width }) =>
                                    routes[route.name]({
                                        ...route.params,
                                        "columnWidths": {
                                            ...route.params.columnWidths,
                                            [field]: width
                                        }
                                    }).replace()
                                }
                                columnWidths={route.params.columnWidths}
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
    "initializing": {
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "height": "100%"
    },
    "urlInput": {
        "maxWidth": 950,
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
