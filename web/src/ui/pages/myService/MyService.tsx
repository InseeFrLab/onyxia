import { useEffect } from "react";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { customIcons } from "ui/theme";
import { routes } from "ui/routes";
import { MyServiceButtonBar } from "./MyServiceButtonBar";
import { Tabs } from "onyxia-ui/Tabs";
import { tabIds } from "./tabIds";
import { capitalize } from "tsafe/capitalize";
import { useCore, useCoreState } from "core";
import { LogsTab } from "./LogsTab";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { EnvTab } from "./EnvTab";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyService(props: Props) {
    const { className, route } = props;

    const { cx, classes } = useStyles();

    const { serviceDetails } = useCore().functions;

    const { isReady, helmReleaseFriendlyName, monitoringUrl } = useCoreState(
        "serviceDetails",
        "main"
    );

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
                        tabs={tabIds.map(tabId => ({
                            "id": tabId,
                            "title": capitalize(tabId)
                        }))}
                        activeTabId={route.params.tabId}
                        maxTabCount={3}
                        onRequestChangeActiveTab={tabId =>
                            routes
                                .myService({
                                    ...route.params,
                                    tabId
                                })
                                .replace()
                        }
                    >
                        {(() => {
                            switch (route.params.tabId) {
                                case "logs":
                                    return <LogsTab />;
                                case "env":
                                    return <EnvTab />;
                            }
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
