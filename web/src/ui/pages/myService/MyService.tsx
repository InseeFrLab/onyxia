import { useEffect } from "react";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { customIcons } from "ui/theme";
import { routes } from "ui/routes";
import { MyServiceButtonBar } from "./MyServiceButtonBar";
import { Tabs } from "onyxia-ui/Tabs";
import { useCore, useCoreState } from "core";
import { PodLogsTab } from "./PodLogsTab";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { HelmValuesTab } from "./HelmValuesTab";
import { assert, type Equals } from "tsafe/assert";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyService(props: Props) {
    const { className, route } = props;

    const { cx, classes } = useStyles();

    const { serviceDetails } = useCore().functions;

    const {
        isReady,
        helmReleaseFriendlyName,
        monitoringUrl,
        podNames,
        paginatedLogsByPodName,
        formattedHelmValues
    } = useCoreState("serviceDetails", "main");

    useEffect(() => {
        const { setInactive } = serviceDetails.setActive({
            "helmReleaseName": route.params.helmReleaseName
        });

        return () => setInactive();
    }, [route.params.helmReleaseName]);

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.servicesSvgUrl}
                title={helmReleaseFriendlyName ?? route.params.helmReleaseName}
                helpTitle={"Monitoring your service"}
                helpContent={
                    "Here you can monitor your service and see its logs, metrics, and other details."
                }
                helpIcon="sentimentSatisfied"
            />
            <MyServiceButtonBar
                onClick={buttonId => {
                    switch (buttonId) {
                        case "back":
                            routes.myServices().push();
                            break;
                        case "monitoring":
                            window.open(monitoringUrl);
                            break;
                    }
                }}
                isMonitoringDisabled={monitoringUrl === undefined}
            />

            {(() => {
                if (!isReady) {
                    return (
                        <div className={classes.circularProgressWrapper}>
                            <CircularProgress />
                        </div>
                    );
                }

                return (
                    <Tabs
                        className={classes.tabs}
                        tabs={[
                            ...podNames.map(podName => ({
                                "id": `logs:${podName}`,
                                "title": `${podName} Pod Logs`
                            })),
                            {
                                "id": "values",
                                "title": "Helm Values"
                            }
                        ]}
                        activeTabId={(() => {
                            switch (route.params.tabId) {
                                case "values":
                                    return "values";
                                case "logs":
                                    return `logs:${route.params.pod ?? podNames[0]}`;
                            }
                            assert<Equals<typeof route.params.tabId, never>>(false);
                        })()}
                        maxTabCount={4}
                        onRequestChangeActiveTab={tabId => {
                            if (tabId === "values") {
                                routes
                                    .myService({
                                        ...route.params,
                                        tabId
                                    })
                                    .replace();
                                return;
                            }

                            if (tabId.startsWith("logs:")) {
                                routes
                                    .myService({
                                        ...route.params,
                                        "tabId": "logs",
                                        "pod": tabId.slice("logs:".length)
                                    })
                                    .replace();
                                return;
                            }

                            assert(false);
                        }}
                    >
                        {(() => {
                            switch (route.params.tabId) {
                                case "values":
                                    return (
                                        <HelmValuesTab
                                            formattedHelmValues={formattedHelmValues}
                                        />
                                    );
                                case "logs": {
                                    const podName = route.params.pod ?? podNames[0];
                                    return (
                                        <PodLogsTab
                                            paginatedLogs={
                                                paginatedLogsByPodName[podName]
                                            }
                                        />
                                    );
                                }
                            }

                            assert<Equals<typeof route.params.tabId, never>>(false);
                        })()}
                    </Tabs>
                );
            })()}
        </div>
    );
}

const useStyles = tss.withName({ MyService }).create(({ theme }) => ({
    "root": {
        "height": "100%",
        "overflow": "auto",
        "paddingRight": theme.spacing(2)
    },
    "circularProgressWrapper": {
        "display": "flex",
        "justifyContent": "center",
        "alignItems": "center",
        "height": theme.typography.rootFontSizePx * 20
    },
    "tabs": {
        "marginTop": theme.spacing(4)
    }
}));
