import { useEffect } from "react";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { customIcons } from "lazy-icons";
import { routes } from "ui/routes";
import { MyServiceButtonBar } from "./MyServiceButtonBar";
import { Tabs } from "onyxia-ui/Tabs";
import { useCore, useCoreState } from "core";
import { PodLogsTab } from "./PodLogsTab";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { CommandBar } from "ui/shared/CommandBar";
import { useEvt } from "evt/hooks";
import { useDomRect } from "powerhooks/useDomRect";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

export type Props = {
    route: PageRoute;
    className?: string;
};

const MyService = withLoginEnforced((props: Props) => {
    const { className, route } = props;

    const { t } = useTranslation({ MyService });

    const { serviceDetails } = useCore().functions;

    useEffect(() => {
        const { setInactive } = serviceDetails.setActive({
            helmReleaseName: route.params.helmReleaseName
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
        commandLogsEntries,
        isCommandBarExpanded
    } = useCoreState("serviceDetails", "main");

    const isCommandBarEnabled = (function useClosure() {
        const { isCommandBarEnabled } = useCoreState("userConfigs", "userConfigs");

        return isCommandBarExpanded ? true : isCommandBarEnabled;
    })();

    const { cx, classes, theme } = useStyles({ isCommandBarEnabled });

    const {
        ref: contentWrapperRef,
        domRect: { height: contentWrapperHeight }
    } = useDomRect();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.headerWrapper}>
                <PageHeader
                    mainIcon={customIcons.servicesSvgUrl}
                    title={t("page title", {
                        helmReleaseFriendlyName:
                            helmReleaseFriendlyName ?? route.params.helmReleaseName
                    })}
                    helpCollapseParams={{
                        behavior: "controlled",
                        isCollapsed: true
                    }}
                    helpTitle={""}
                    helpContent=""
                />
                <MyServiceButtonBar
                    onClickBack={() => routes.myServices().push()}
                    onClickHelmValues={() => serviceDetails.toggleHelmValues()}
                    areHelmValuesShown={isCommandBarExpanded ?? false}
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
                    <div ref={contentWrapperRef} className={classes.contentWrapper}>
                        {isCommandBarEnabled && (
                            <CommandBar
                                classes={{
                                    root: classes.commandBar,
                                    rootWhenExpended: classes.commandBarWhenExpanded,
                                    expandIconButton: classes.commandBarExpendIconButton
                                }}
                                entries={commandLogsEntries}
                                maxHeight={contentWrapperHeight - theme.spacing(4)}
                                isExpended={isCommandBarExpanded}
                                onIsExpendedChange={isExpended => {
                                    if (!isExpended) {
                                        serviceDetails.collapseCommandBar();
                                    }
                                }}
                            />
                        )}
                        <Tabs
                            className={classes.tabs}
                            classes={{
                                content: classes.tabsContent
                            }}
                            tabs={podNames.map(podName => ({
                                id: podName,
                                title: `Pod: ${podName}`
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
});

export default MyService;

const { i18n } = declareComponentKeys<{
    K: "page title";
    P: {
        helmReleaseFriendlyName: string;
    };
}>()({ MyService });

export type I18n = typeof i18n;

const useStyles = tss
    .withName({ MyService })
    .withNestedSelectors<"commandBarExpendIconButton">()
    .withParams<{ isCommandBarEnabled: boolean }>()
    .create(({ theme, isCommandBarEnabled, classes }) => ({
        root: {
            height: "100%",
            paddingRight: theme.spacing(2),
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        },
        headerWrapper: {
            position: "relative"
        },
        contentWrapper: {
            position: "relative",
            paddingTop: (isCommandBarEnabled ? 40 : 0) + theme.spacing(2),
            flex: 1,
            overflow: "hidden"
        },
        commandBar: {
            position: "absolute",
            right: 0,
            top: 0,
            zIndex: 2,
            transition: "opacity 750ms linear",
            width: "min(100%, 600px)"
        },
        commandBarWhenExpanded: {
            width: "min(100%, 1100px)",
            [`& .${classes.commandBarExpendIconButton}`]: {
                visibility: "unset"
            }
        },
        commandBarExpendIconButton: {
            visibility: "hidden"
        },
        circularProgressWrapper: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: theme.typography.rootFontSizePx * 20
        },
        tabs: {
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        },
        tabsContent: {
            flex: 1,
            overflow: "hidden"
        }
    }));
