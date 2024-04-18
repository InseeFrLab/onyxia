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
import { CommandBar } from "ui/shared/CommandBar";
import { useEvt } from "evt/hooks";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyService(props: Props) {
    const { className, route } = props;

    const { isCommandBarEnabled } = useCoreState("userConfigs", "userConfigs");

    const { cx, classes } = useStyles({ isCommandBarEnabled });

    const { serviceDetails } = useCore().functions;

    useEffect(() => {
        const { setInactive } = serviceDetails.setActive({
            "helmReleaseName": route.params.helmReleaseName
        });

        return () => setInactive();
    }, [route.params.helmReleaseName]);

    const { evtServiceDetails } = useCore().evts;

    useEvt(
        ctx => {
            evtServiceDetails.attach(
                ({ actionName }) => actionName === "redirect away",
                ctx,
                () => {
                    routes.myServices().replace();
                }
            );
        },
        [evtServiceDetails]
    );

    const {
        isReady,
        helmReleaseFriendlyName,
        podNames,
        selectedPodName,
        monitoringUrl,
        commandLogsEntries
    } = useCoreState("serviceDetails", "main");

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.headerWrapper}>
                <PageHeader
                    mainIcon={customIcons.servicesSvgUrl}
                    title={`${helmReleaseFriendlyName ?? route.params.helmReleaseName} Monitoring`}
                    helpCollapseParams={{
                        "behavior": "controlled",
                        "isCollapsed": true
                    }}
                    helpTitle={""}
                    helpContent=""
                />
                <MyServiceButtonBar
                    onClickBack={() => routes.myServices().push()}
                    monitoringUrl={monitoringUrl}
                />
            </div>

            {(() => {
                if (!isReady) {
                    return (
                        <div className={classes.circularProgressWrapper}>
                            <CircularProgress />
                        </div>
                    );
                }

                return (
                    <div className={classes.contentWrapper}>
                        {isCommandBarEnabled && (
                            <CommandBar
                                classes={{
                                    "root": classes.commandBar,
                                    "expandIconButton": classes.commandBarExpendIconButton
                                }}
                                entries={commandLogsEntries}
                                maxHeight={Infinity}
                            />
                        )}
                        <Tabs
                            className={classes.tabs}
                            classes={{
                                "content": classes.tabsContent
                            }}
                            tabs={podNames.map(podName => ({
                                "id": podName,
                                "title": `Pod: ${podName}`
                            }))}
                            activeTabId={selectedPodName}
                            maxTabCount={3}
                            onRequestChangeActiveTab={podName =>
                                serviceDetails.changeSelectedPod({ podName })
                            }
                        >
                            <PodLogsTab
                                helmReleaseName={route.params.helmReleaseName}
                                podName={selectedPodName}
                            />
                        </Tabs>
                    </div>
                );
            })()}
        </div>
    );
}

const useStyles = tss
    .withName({ MyService })
    .withParams<{ isCommandBarEnabled: boolean }>()
    .create(({ theme, isCommandBarEnabled }) => ({
        "root": {
            "height": "100%",
            "paddingRight": theme.spacing(2),
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "headerWrapper": {
            "position": "relative"
        },
        "contentWrapper": {
            "position": "relative",
            "paddingTop": (isCommandBarEnabled ? 40 : 0) + theme.spacing(2),
            "flex": 1,
            "overflow": "hidden"
        },
        "commandBar": {
            "position": "absolute",
            "right": 0,
            "top": 0,
            "zIndex": 1,
            "transition": "opacity 750ms linear",
            "width": "min(100%, 600px)"
        },
        "commandBarExpendIconButton": {
            "visibility": "hidden"
        },
        "circularProgressWrapper": {
            "display": "flex",
            "justifyContent": "center",
            "alignItems": "center",
            "height": theme.typography.rootFontSizePx * 20
        },
        "tabs": {
            "height": "100%",
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "tabsContent": {
            "flex": 1,
            "overflow": "hidden"
        }
    }));
