import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys } from "i18nifty";
import { UrlInput } from "../dataExplorer/UrlInput";
import { useEffect } from "react";
import { getCoreSync, useCoreState } from "core";
import { routes, useRoute } from "ui/routes";
import { routeGroup } from "./route";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";
import type { Link } from "type-route";
import { useTranslation } from "ui/i18n";
import { env } from "env";
import { assert } from "tsafe/assert";
import { DatasetListVirtualized } from "./DatasetListVirtualized";

export default function DataCollection() {
    const route = useRoute();
    assert(routeGroup.has(route));

    const { t } = useTranslation({ DataCollection });
    const { datasets, queryParams, errors, isQuerying } = useCoreState(
        "dataCollection",
        "main"
    );

    const {
        functions: { dataCollection }
    } = getCoreSync();

    const { classes, css } = useStyles();

    useEffect(() => {
        dataCollection.initialize({
            sourceUrl: route.params.source
        });
    }, [route.params.source]);

    useEffect(() => {
        if (queryParams === undefined) {
            routes[route.name]().replace();
            return;
        }

        routes[route.name]({
            ...route.params,
            source: queryParams.sourceUrl
        }).replace();
    }, [queryParams]);

    return (
        <div
            className={css({ height: "100%", display: "flex", flexDirection: "column" })}
        >
            <PageHeader
                mainIcon={getIconUrlByName("FolderSpecial")}
                title={t("page header title")}
                helpTitle={t("page header help title")}
                helpContent={t("page header help content", {
                    demoCatalogLink: routes[route.name]({
                        source: env.SAMPLE_DATACOLLECTION_URL
                    }).link
                })}
            />
            <UrlInput
                className={classes.urlInput}
                onUrlChange={value => {
                    dataCollection.updateSourceUrl({ sourceUrl: value });
                }}
                url={queryParams === undefined ? "" : queryParams.sourceUrl}
                getIsValidUrl={() => true}
            />
            {(() => {
                if (errors !== undefined) {
                    return (
                        <Alert severity="error">
                            {errors.length > 1 ? (
                                <ul>
                                    {errors.map(error => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            ) : (
                                errors[0]
                            )}
                        </Alert>
                    );
                }

                if (isQuerying) {
                    return (
                        <div className={classes.initializing}>
                            <CircularProgress size={70} />
                        </div>
                    );
                }

                if (datasets === undefined) return null;

                return <DatasetListVirtualized datasets={datasets} />;
            })()}
        </div>
    );
}

const useStyles = tss.withName({ DataCollection }).create(({ theme }) => ({
    urlInput: {
        marginBottom: theme.spacing(4)
    },
    initializing: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    }
}));

const { i18n } = declareComponentKeys<
    | "page header title"
    | "page header help title"
    | {
          K: "page header help content";
          P: { demoCatalogLink: Link };
          R: JSX.Element;
      }
>()({
    DataCollection
});

export type I18n = typeof i18n;
