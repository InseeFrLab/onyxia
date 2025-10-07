import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName } from "lazy-icons";
import { getCoreSync, getCore, useCoreState } from "core";
import { routes, getRoute, session } from "ui/routes";
import { declareComponentKeys } from "i18nifty";
import { UrlInput } from "../dataExplorer/UrlInput";
import { useEffect } from "react";
import { routeGroup } from "./route";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { tss } from "tss";
import type { Link } from "type-route";
import { env } from "env";
import { assert } from "tsafe/assert";
import { DatasetListVirtualized } from "./DatasetListVirtualized";
import { withLoader } from "ui/tools/withLoader";
import { useEvt } from "evt/hooks";
import { useTranslation } from "ui/i18n";
import type { QueryResponse } from "core/usecases/dataCollection/decoupledLogic/performQuery";
import { Text } from "onyxia-ui/Text";

const Page = withLoader({
    loader,
    Component: DataCollection
});

export default Page;

async function loader() {
    const core = await getCore();

    const route = getRoute();
    assert(routeGroup.has(route));

    const { routeParams_toRestore } = core.functions.dataCollection.load({
        routeParams: route.params
    });

    if (routeParams_toRestore !== undefined) {
        routes.dataCollection(routeParams_toRestore).replace();
    }
}

function DataCollection() {
    const {
        functions: { dataCollection },
        evts: { evtDataCollection }
    } = getCoreSync();

    useEvt(ctx => {
        evtDataCollection
            .pipe(ctx)
            .pipe(action => action.actionName === "updateRoute")
            .attach(({ routeParams, method }) =>
                routes.dataCollection(routeParams)[method]()
            );
    }, []);

    useEffect(
        () =>
            session.listen(route => {
                if (routeGroup.has(route)) {
                    dataCollection.notifyRouteParamsExternallyUpdated({
                        routeParams: route.params
                    });
                }
            }),
        []
    );

    const { t } = useTranslation({ DataCollection });

    const { classes, css } = useStyles();

    const { dataCollectionUrl, isQuerying, catalogView } = useCoreState(
        "dataCollection",
        "view"
    );

    return (
        <div
            className={css({ height: "100%", display: "flex", flexDirection: "column" })}
        >
            <PageHeader
                mainIcon={getIconUrlByName("FolderSpecial")}
                title={t("page header title")}
                helpTitle={t("page header help title")}
                helpContent={t("page header help content", {
                    demoCatalogLink: routes.dataCollection({
                        source: env.SAMPLE_DATA_COLLECTION_URL
                    }).link
                })}
            />
            <UrlInput
                className={classes.urlInput}
                onUrlChange={url => {
                    dataCollection.updateCatalogUrl({ url });
                }}
                url={dataCollectionUrl}
            />
            {(() => {
                if (catalogView === undefined) {
                    if (isQuerying) {
                        return (
                            <div className={classes.initializing}>
                                <CircularProgress size={70} />
                            </div>
                        );
                    }

                    return null;
                }

                const { isErrored } = catalogView;

                if (isErrored) {
                    const { errorCause, errorMessages } = catalogView;

                    return (
                        <Alert severity="error">
                            <Text typo="label 1">{t(errorCause)}</Text>
                            {errorMessages.length > 1 ? (
                                <ul>
                                    {errorMessages.map(error => (
                                        <li key={error}>
                                            <Text typo="body 1">{error}</Text>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                errorMessages[0]
                            )}
                        </Alert>
                    );
                }

                const { datasets } = catalogView;
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
    | QueryResponse.Failed["errorCause"]
>()({
    DataCollection
});

export type I18n = typeof i18n;
