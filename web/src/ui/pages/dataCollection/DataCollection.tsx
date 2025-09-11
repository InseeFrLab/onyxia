import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys } from "i18nifty";
import { UrlInput } from "../dataExplorer/UrlInput";
import { useEffect } from "react";
import { useCore, useCoreState } from "core";
import { routes } from "ui/routes";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { DatasetCard } from "./DatasetCard";
import { tss } from "tss";

type Props = {
    route: PageRoute;
    className?: string;
};

export default function DataCollection(props: Props) {
    const { className, route } = props;

    const { classes, css } = useStyles();

    const { datasets, queryParams, error, isQuerying } = useCoreState(
        "dataCollection",
        "main"
    );
    const { dataCollection } = useCore().functions;

    useEffect(() => {
        dataCollection.initialize({
            sourceUrl: route.params.source,
            rowsPerPage: route.params.rowsPerPage,
            page: route.params.page
        });
    }, [route.params.source]);

    useEffect(() => {
        if (queryParams === undefined) {
            routes[route.name]().replace();
            return;
        }

        routes[route.name]({
            ...route.params,
            source: queryParams?.sourceUrl,
            page: queryParams.page,
            rowsPerPage: queryParams.rowsPerPage
        }).replace();
    }, [queryParams]);

    return (
        <div className={className}>
            <PageHeader
                title="Data Collection"
                mainIcon={getIconUrlByName("FolderSpecial")}
                helpContent={
                    "Entrez simplement l'URL https:// de votre schema jsonld dcat"
                }
            />
            <UrlInput
                className={classes.urlInput}
                onUrlChange={value => {
                    dataCollection.updateSourceUrl({ sourceUrl: value });
                }}
                url={queryParams === undefined ? "" : queryParams.sourceUrl}
                getIsValidUrl={() => true}
            />
            <div className={css({ height: "100vh", overflowY: "auto" })}>
                {(() => {
                    if (error !== undefined) {
                        return <Alert severity="error">{error}</Alert>;
                    }

                    if (isQuerying) {
                        return <CircularProgress size={70} />;
                    }

                    if (datasets === undefined) return null;

                    return (
                        <div className={classes.datasets}>
                            {datasets.map(dataset => (
                                <DatasetCard key={dataset.id} dataset={dataset} />
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ DataCollection }).create(({ theme }) => ({
    urlInput: {
        marginBottom: theme.spacing(4)
    },
    datasets: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3)
    }
}));

const { i18n } = declareComponentKeys<"page header title" | "page header help title">()({
    DataCollection
});

export type I18n = typeof i18n;
