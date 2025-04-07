import { useEffect, useState } from "react";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import type { PageRoute } from "./route";
import { customIcons, getIconUrlByName } from "lazy-icons";
import { routes } from "ui/routes";
import { useCore, useCoreState } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { CommandBar } from "ui/shared/CommandBar";
import { useEvt } from "evt/hooks";
import { useDomRect } from "powerhooks/useDomRect";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";
import { SwitcherButton } from "ui/shared/SwitcherButton";
import { Icon } from "onyxia-ui/Icon";
import { OverviewTab } from "./OverviewTab";
import { HelmTab } from "./HelmTab";

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

    const { cx, classes, theme } = useStyles();

    const {
        ref: contentWrapperRef,
        domRect: { height: contentWrapperHeight }
    } = useDomRect();

    const [tabSelected, setTabSelected] = useState<"Overview" | "Helm" | "Pods" | "Logs">(
        "Overview"
    );
    const headerValues = [
        {
            onClick: () => {
                routes.myServices().replace();
            },
            isSelected: false,
            text: <Icon icon={getIconUrlByName("ArrowBack")} />
        },
        {
            onClick: () => {
                setTabSelected("Overview");
            },
            isSelected: tabSelected === "Overview",
            text: "Overview"
        },
        {
            onClick: () => {
                setTabSelected("Helm");
            },
            isSelected: tabSelected === "Helm",
            text: "Helm"
        },
        {
            onClick: () => {
                setTabSelected("Pods");
            },
            isSelected: tabSelected === "Pods",
            text: "Pods"
        },
        {
            onClick: () => {
                setTabSelected("Logs");
            },
            isSelected: tabSelected === "Logs",
            text: "Logs"
        }
    ];
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
                <div className={classes.header}>
                    {headerValues.map(({ onClick, isSelected, text }) => (
                        <SwitcherButton
                            isSelected={isSelected}
                            text={text}
                            onClick={onClick}
                        />
                    ))}
                    {isCommandBarEnabled && commandLogsEntries !== undefined && (
                        <CommandBar
                            classes={{
                                root: classes.commandBar
                            }}
                            entries={commandLogsEntries}
                            maxHeight={contentWrapperHeight - theme.spacing(4)}
                        />
                    )}
                </div>
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
                        {(() => {
                            switch (tabSelected) {
                                case "Overview":
                                    return (
                                        <OverviewTab
                                            helmRelease={{
                                                friendlyName: "jupyter-python-472920",
                                                revision: 1,
                                                state: "deployed",
                                                updated: Date.now() - 2 * 60 * 60 * 1000, // il y a 2 heures
                                                chartName: "jupyter-python",
                                                version: "2.2.2"
                                            }}
                                            pods={[
                                                {
                                                    name: "jupyter-python-472920-abc123",
                                                    status: "🟢 Ready",
                                                    ready: "1/1",
                                                    restartCount: 0
                                                },
                                                {
                                                    name: "jupyter-python-472920-def456",
                                                    status: "🟡 Init",
                                                    ready: "0/1",
                                                    restartCount: 1
                                                }
                                            ]}
                                            image="inseefrlab/onyxia-jupyter-python:py3.12.9"
                                            monitoringUrl="https://grafana.sspcloud.fr/d/abc123/jupyter-dashboard"
                                        />
                                    );
                                case "Helm":
                                    return (
                                        <HelmTab
                                            helmValues={`discovery:
  metaflow: true
  mlflow: true
  hive: true
networking:
  user:
    port: "5000"
    enabled: false
git:
  branch: ""
  enabled: true
  token: ""
  name: ddecrulle
  cache: "0"
  repository: ""
  email: dylan.decrulle@insee.fr
s3:
  pathStyleAccess: true
  defaultRegion: us-east-1
  endpoint: minio.lab.sspcloud.fr
  enabled: true
  workingDirectoryPath: ddecrulle/
kubernetes:
  role: view
  enabled: true
init:
  personalInitArgs: ""
  regionInit: ""
  personalInit: ""
ingress:
  enabled: true
  certManagerClusterIssuer: ""
  hostname: user.lab.sspcloud.fr
  userHostname: user.lab.sspcloud.fr
  ingressClassName: onyxia
  useCertManager: false
replicaCount: "2"
service:
  image:
    custom:
      version: inseefrlab/onyxia-jupyter-python:py3.12.9
      enabled: false
    pullPolicy: IfNotPresent
    version: inseefrlab/onyxia-jupyter-python:py3.12.9
  customPythonEnv: false
proxy:
  enabled: false
  httpProxy: ""
  httpsProxy: ""
  noProxy: ""
resources:
  limits:
    memory: 50Gi
    cpu: 15000m
  requests:
    memory: 2Gi
    cpu: 100m
global:
  suspend: false
openshiftSCC:
  enabled: false
  scc: anyuid
startupProbe:
  successThreshold: "1"
  failureThreshold: "60"
  periodSeconds: "10"
  initialDelaySeconds: "10"
  timeoutSeconds: "2"
message:
  fr: "**NB:** ce service pourrait être supprimé après 7 jours d'utilisation en
    raison de nos règles de gestion"
  en: "**Warning:** this service may be deleted after 7 days due to our management
    policies"
route:
  enabled: false
  userHostname: .user.lab.sspcloud.fr
  hostname: user.lab.sspcloud.fr
persistence:
  size: 10Gi
  enabled: true
userPreferences:
  darkMode: true
  language: fr
repository:
  pipRepository: ""
  condaRepository: ""`}
                                        />
                                    );
                                case "Pods":
                                    return <div>Pods Content</div>;
                                case "Logs":
                                    return <div>Logs Content</div>;
                            }
                        })()}
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

const useStyles = tss.withName({ MyService }).create(({ theme }) => ({
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
    header: {
        display: "flex"
    },
    contentWrapper: {
        position: "relative",
        paddingTop: theme.spacing(2),
        flex: 1,
        overflow: "hidden"
    },
    commandBar: {
        position: "absolute",
        right: 0,
        zIndex: 2,
        transition: "opacity 750ms linear",
        width: "min(100%, 600px)"
    },
    circularProgressWrapper: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: theme.typography.rootFontSizePx * 20
    }
}));
