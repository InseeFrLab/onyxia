import { useEffect } from "react";
import { tss } from "tss";
import type { PageRoute } from "./route";
import { SearchBar } from "onyxia-ui/SearchBar";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { Alert } from "onyxia-ui/Alert";

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
            "source": route.params.source ?? "",
            "limit": route.params.limit ?? 10,
            "page": route.params.page ?? 1
        });
    }, [route]);

    const { data, errorMessage, isQuerying } = useCoreState("dataExplorer", "main");

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

                    if (isQuerying) {
                        return <div>Querying...</div>;
                    }

                    if (data === undefined) {
                        return null;
                    }

                    console.log("count: ", data.rowCount);

                    return <pre>{JSON.stringify(data.rows, null, 2)}</pre>;
                })()}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ DataExplorer }).create(({ theme }) => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "searchBar": {
        "maxWidth": 950
    },
    "errorAlert": {
        "marginTop": theme.spacing(4),
        "maxWidth": 950
    },
    "mainArea": {
        "flex": 1,
        "overflow": "auto"
    }
}));
