import { useEffect } from "react";
import { tss } from "tss";
import type { PageRoute } from "./route";
import { SearchBar } from "onyxia-ui/SearchBar";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";

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
            "offset": route.params.offset ?? 0
        });
    }, [route]);

    const { data, errorMessage, isQuerying } = useCoreState("dataExplorer", "main");

    return (
        <div className={cx(classes.root, className)}>
            <SearchBar
                placeholder="URL data source"
                search={route.params.source ?? ""}
                onSearchChange={source =>
                    routes[route.name]({
                        ...route.params,
                        source
                    }).replace()
                }
            />
            <div>
                {(() => {
                    if (errorMessage !== undefined) {
                        return <div>{errorMessage}</div>;
                    }

                    if (isQuerying) {
                        return <div>Querying...</div>;
                    }

                    return <pre>{JSON.stringify(data, null, 2)}</pre>;
                })()}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ DataExplorer }).create(() => ({
    "root": {
        "height": "100%"
    }
}));
