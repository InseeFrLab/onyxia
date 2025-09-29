import { useEffect } from "react";
import { tss } from "tss";
import { routes, getRoute, session } from "ui/routes";
import { routeGroup } from "./route";
import { getCoreSync, useCoreState, getCore } from "core";
import { Alert } from "onyxia-ui/Alert";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { assert } from "tsafe/assert";
import { UrlInput } from "./UrlInput";
import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { Link } from "type-route";
import { env } from "env";
import { supportedFileTypes } from "core/adapters/sqlOlap/utils/inferFileType";
import { withLoader } from "ui/tools/withLoader";
import { useEvt } from "evt/hooks/useEvt";
import type { QueryResponse } from "core/usecases/dataExplorer/decoupledLogic/performQuery";

const Page = withLoader({
    loader,
    Component: DataExplorer
});
export default Page;

async function loader() {
    const core = await getCore();

    const route = getRoute();
    assert(routeGroup.has(route));

    core.functions.dataExplorer.load({
        routeParams: route.params
    });
}

function DataExplorer() {
    const {
        functions: { dataExplorer },
        evts: { evtDataExplorer }
    } = getCoreSync();

    useEvt(ctx => {
        evtDataExplorer
            .pipe(ctx)
            .pipe(action => action.actionName === "updateRoute")
            .attach(({ routeParams, method }) =>
                routes.dataExplorer(routeParams)[method]()
            );
    }, []);

    useEffect(
        () =>
            session.listen(route => {
                if (routeGroup.has(route)) {
                    dataExplorer.notifyRouteParamsExternallyUpdated({
                        routeParams: route.params
                    });
                }
            }),
        []
    );

    const { urlBarText, isQuerying, dataGridView } = useCoreState("dataExplorer", "view");

    const { t } = useTranslation({ DataExplorer });

    const { classes } = useStyles();

    return (
        <div className={classes.root}>
            <PageHeader
                classes={{
                    helpMiddle: classes.pageHeaderHelpMiddle
                }}
                mainIcon={getIconUrlByName("DocumentScanner")}
                title={t("page header title")}
                helpTitle={t("page header help title")}
                helpContent={t("page header help content", {
                    demoParquetFileLink: routes.dataExplorer({
                        source: env.SAMPLE_DATASET_URL
                    }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
                titleCollapseParams={{
                    behavior: "controlled",
                    isCollapsed: dataGridView !== undefined
                }}
                helpCollapseParams={{
                    behavior: "controlled",
                    isCollapsed: dataGridView !== undefined
                }}
            />
            <UrlInput
                className={classes.urlInput}
                onUrlChange={url => {
                    dataExplorer.updateUrlBarText({ urlBarText: url });
                }}
                url={urlBarText}
            />
            <div className={classes.mainArea}>
                {(() => {
                    if (dataGridView === undefined) {
                        return !isQuerying ? null : (
                            <div className={classes.initializing}>
                                <CircularProgress size={70} />
                            </div>
                        );
                    }

                    if (dataGridView.isErrored) {
                        const { errorCause } = dataGridView;
                        return (
                            <Alert className={classes.errorAlert} severity="error">
                                {(() => {
                                    switch (errorCause) {
                                        case "unsupported file type":
                                            return t("unsupported file type", {
                                                supportedFileTypes
                                            });
                                        default:
                                            return t(errorCause);
                                    }
                                })()}
                            </Alert>
                        );
                    }

                    return (
                        <div className={classes.dataGridWrapper}>
                            <DataExplorer />
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
    | { K: "unsupported file type"; P: { supportedFileTypes: readonly string[] } }
    | Exclude<QueryResponse.Failed["errorCause"], "unsupported file type">
>()({ DataExplorer });
export type I18n = typeof i18n;
