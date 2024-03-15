import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { customIcons } from "ui/theme";
import { routes } from "ui/routes";
import { MyServiceButtonBar } from "./MyServiceButtonBar";
import { Tabs } from "onyxia-ui/Tabs";
import { tabIds } from "./tabIds";
import { capitalize } from "tsafe/capitalize";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyService(props: Props) {
    const { className, route } = props;

    console.log(route);

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.servicesSvgUrl}
                title={route.params.helmReleaseName}
                helpTitle={"Monitoring your service"}
                helpContent={
                    "Here you can monitor your service and see its logs, metrics, and other details."
                }
                helpIcon="sentimentSatisfied"
            />
            <div className={classes.belowHeader}>
                <MyServiceButtonBar
                    onClick={buttonId => {
                        console.log(`Button id click ${buttonId}`);
                        if (buttonId === "back") {
                            routes.myServices().push();
                        }
                    }}
                />
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
                    {route.params.tabId}
                </Tabs>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ MyService }).create(({ theme }) => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "belowHeader": {
        "position": "relative",
        "flex": 1,
        "display": "flex",
        "flexDirection": "column",
        "overflow": "hidden"
    },
    "tabs": {
        "marginTop": theme.spacing(4)
    }
}));
