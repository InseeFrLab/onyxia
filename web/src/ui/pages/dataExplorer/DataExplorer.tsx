import { useEffect } from "react";
import { tss } from "tss";
import type { PageRoute } from "./route";
import { SearchBar } from "onyxia-ui/SearchBar";
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
import { assert } from "tsafe/assert";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function DataExplorer(props: Props) {
    const { className, route } = props;

    const { classes, cx } = useStyles();

    const { dataExplorer } = useCore().functions;

    useEffect(() => {
        dataExplorer.setQueryParams({
            "sourceUrl": route.params.source ?? "",
            "rowsPerPage": route.params.rowsPerPage,
            "page": route.params.page
        });
    }, [route]);

    const { rows, columns, rowCount, errorMessage, isQuerying } = useCoreState(
        "dataExplorer",
        "main"
    );

    return (
        <div className={cx(classes.root, className)}>
            <SearchBar
                className={classes.searchBar}
                placeholder="URL data source"
                search={route.params.source ?? ""}
                onSearchChange={source =>
                    routes[route.name]({
                        ...route.params,
                        source
                    }).replace()
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
    "searchBar": {
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
