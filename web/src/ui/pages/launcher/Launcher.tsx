import { useEffect } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useCoreState, useCore } from "core";
import { useStateRef } from "powerhooks/useStateRef";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useDomRect } from "powerhooks/useDomRect";
import { useConst } from "powerhooks/useConst";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { useSplashScreen } from "onyxia-ui";
import { useEvt } from "evt/hooks";
import { routes, getPreviousRouteName } from "ui/routes";
import { env } from "env-parsed";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { Evt, type UnpackEvt } from "evt";
import { LauncherDialogs, type Props as LauncherDialogsProps } from "./LauncherDialogs";
import { CommandBar } from "ui/shared/CommandBar";
import { saveAs } from "file-saver";
import { LauncherMainCard } from "./LauncherMainCard";
import { LauncherConfigurationCard } from "./LauncherConfigurationCard";
import { customIcons } from "ui/theme";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function Launcher(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Launcher });

    const {
        evtAcknowledgeSharingOfConfigConfirmDialogOpen,
        evtAutoLaunchDisabledDialogOpen,
        evtSensitiveConfigurationDialogOpen,
        evtNoLongerBookmarkedDialogOpen
    } = useConst(() => ({
        "evtAcknowledgeSharingOfConfigConfirmDialogOpen":
            Evt.create<
                UnpackEvt<
                    LauncherDialogsProps["evtAcknowledgeSharingOfConfigConfirmDialogOpen"]
                >
            >(),
        "evtAutoLaunchDisabledDialogOpen":
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtAutoLaunchDisabledDialogOpen"]>
            >(),
        "evtSensitiveConfigurationDialogOpen":
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtSensitiveConfigurationDialogOpen"]>
            >(),
        "evtNoLongerBookmarkedDialogOpen":
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtNoLongerBookmarkedDialogOpen"]>
            >()
    }));

    const {
        isReady,
        friendlyName,
        isThereASavedConfigWithThisFriendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorableConfig,
        isRestorableConfigSaved,
        areAllFieldsDefault,
        chartName,
        chartVersion,
        availableChartVersions,
        catalogName,
        catalogRepositoryUrl,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        chartSourceUrls,
        groupProjectName
    } = useCoreState("launcher", "main");

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const { launcher, restorableConfigManager, k8sCredentials } = useCore().functions;

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        const {
            catalogId,
            chartName,
            version: chartVersion,
            formFieldsValueDifferentFromDefault
        } = route.params;

        showSplashScreen({ "enableTransparency": true });

        launcher.initialize({
            catalogId,
            chartName,
            chartVersion,
            formFieldsValueDifferentFromDefault
        });

        return () => launcher.reset();
    }, []);

    useEffect(() => {
        const { version: chartVersion } = route.params;

        if (chartVersion === undefined) {
            return;
        }

        launcher.changeChartVersion({ chartVersion });
    }, [route.params.version]);

    const { evtLauncher } = useCore().evts;

    useEvt(
        ctx => {
            evtLauncher.$attach(
                action =>
                    action.actionName === "chartVersionInternallySet" ? [action] : null,
                ctx,
                ({ chartVersion }) =>
                    routes[route.name]({
                        ...route.params,
                        "version": chartVersion
                    }).replace()
            );

            evtLauncher.$attach(
                action => (action.actionName === "initialized" ? [action] : null),
                ctx,
                async ({ sensitiveConfigurations }) => {
                    hideSplashScreen();

                    auto_launch: {
                        if (!route.params.autoLaunch) {
                            break auto_launch;
                        }

                        routes[route.name]({
                            ...route.params,
                            "autoLaunch": undefined
                        }).replace();

                        if (
                            env.DISABLE_AUTO_LAUNCH &&
                            //If auto launch from myServices the user is launching one of his service, it's safe
                            getPreviousRouteName() !== "myServices"
                        ) {
                            evtAutoLaunchDisabledDialogOpen.post();
                            break auto_launch;
                        }

                        if (sensitiveConfigurations.length !== 0) {
                            const dDoProceedToLaunch = new Deferred<boolean>();

                            evtSensitiveConfigurationDialogOpen.post({
                                sensitiveConfigurations,
                                "resolveDoProceedToLaunch": dDoProceedToLaunch.resolve
                            });

                            if (!(await dDoProceedToLaunch.pr)) {
                                break auto_launch;
                            }
                        }

                        launcher.launch();
                        return;
                    }
                }
            );

            evtLauncher.attach(
                action => action.actionName === "launchStarted",
                ctx,
                () => showSplashScreen({ "enableTransparency": true })
            );

            evtLauncher.$attach(
                action => (action.actionName === "launchCompleted" ? [action] : null),
                ctx,
                ({ helmReleaseName }) => {
                    hideSplashScreen();
                    routes
                        .myServices({ "autoOpenHelmReleaseName": helmReleaseName })
                        .push();
                }
            );
        },
        [evtLauncher, route.params]
    );

    const { isCommandBarEnabled } = useCoreState("userConfigs", "main");

    useEffect(() => {
        if (restorableConfig === undefined) {
            return;
        }

        const { catalogId, chartName, formFieldsValueDifferentFromDefault } =
            restorableConfig;

        routes[route.name]({
            ...route.params,
            catalogId,
            chartName,
            formFieldsValueDifferentFromDefault
        }).replace();
    }, [restorableConfig]);

    const onRequestCancel = useConstCallback(() =>
        routes.catalog({ "catalogId": route.params.catalogId }).push()
    );

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        navigator.clipboard.writeText(
            window.location.origin +
                routes.launcher({
                    ...route.params,
                    "autoLaunch": true
                }).link.href
        )
    );

    const onRequestToggleBookmark = useConstCallback(async () => {
        assert(restorableConfig !== undefined);

        if (isRestorableConfigSaved) {
            restorableConfigManager.deleteRestorableConfig({ restorableConfig });
        } else {
            if (groupProjectName !== undefined) {
                const doProceed = new Deferred<boolean>();

                evtAcknowledgeSharingOfConfigConfirmDialogOpen.post({
                    groupProjectName,
                    "resolveDoProceed": doProceed.resolve
                });

                if (!(await doProceed.pr)) {
                    return;
                }
            }

            restorableConfigManager.saveRestorableConfig({ restorableConfig });
        }
    });

    const {
        domRect: { height: rootHeight }
    } = useDomRect({
        "ref": scrollableDivRef
    });

    const { classes, cx, css } = useStyles({
        rootHeight,
        isCommandBarEnabled
    });

    if (!isReady) {
        return null;
    }

    return (
        <>
            <div className={cx(classes.root, className)}>
                <PageHeader
                    classes={{
                        "title": css({ "paddingBottom": 3 })
                    }}
                    mainIcon={customIcons.catalogSvgUrl}
                    title={t("header text1")}
                    helpTitle={t("header text2")}
                    helpContent={t("chart sources", {
                        chartName,
                        "urls": chartSourceUrls
                    })}
                    helpIcon="sentimentSatisfied"
                    titleCollapseParams={{
                        "behavior": "collapses on scroll",
                        "scrollTopThreshold": 100,
                        "scrollableElementRef": scrollableDivRef
                    }}
                    helpCollapseParams={{
                        "behavior": "collapses on scroll",
                        "scrollTopThreshold": 50,
                        "scrollableElementRef": scrollableDivRef
                    }}
                />
                <div className={classes.bodyWrapper}>
                    <div className={classes.body} ref={scrollableDivRef}>
                        {isCommandBarEnabled && (
                            <CommandBar
                                classes={{
                                    "root": classes.commandBar,
                                    "rootWhenExpended": classes.commandBarWhenExpended,
                                    "helpDialog": classes.helpDialog
                                }}
                                maxHeight={rootHeight - 30}
                                entries={commandLogsEntries}
                                downloadButton={{
                                    "tooltipTitle": t("download as script"),
                                    "onClick": () =>
                                        saveAs(
                                            new Blob([launchScript.content], {
                                                "type": "text/plain;charset=utf-8"
                                            }),
                                            launchScript.fileBasename
                                        )
                                }}
                                helpDialog={{
                                    "body": (
                                        <div className={classes.helpDialogBody}>
                                            {t("api logs help body", {
                                                "k8CredentialsHref":
                                                    !k8sCredentials.getIsAvailable()
                                                        ? undefined
                                                        : routes.account({
                                                              "tabId": "k8sCredentials"
                                                          }).href,
                                                "myServicesHref":
                                                    routes.myServices().href,
                                                "interfacePreferenceHref": routes.account(
                                                    {
                                                        "tabId": "user-interface"
                                                    }
                                                ).href
                                            })}
                                        </div>
                                    )
                                }}
                            />
                        )}
                        <div className={classes.wrapperForMawWidth}>
                            <LauncherMainCard
                                chartName={chartName}
                                chartIconUrl={chartIconUrl}
                                isThereASavedConfigWithThisFriendlyName={
                                    isThereASavedConfigWithThisFriendlyName
                                }
                                isBookmarked={isRestorableConfigSaved}
                                chartVersion={chartVersion}
                                availableChartVersions={availableChartVersions}
                                onChartVersionChange={chartVersion =>
                                    routes[route.name]({
                                        ...route.params,
                                        "version": chartVersion
                                    }).replace()
                                }
                                catalogName={catalogName}
                                catalogRepositoryUrl={catalogRepositoryUrl}
                                myServicesSavedConfigsExtendedLink={
                                    routes.myServices({
                                        "isSavedConfigsExtended": true
                                    }).link
                                }
                                onRequestToggleBookmark={onRequestToggleBookmark}
                                friendlyName={friendlyName}
                                onFriendlyNameChange={launcher.changeFriendlyName}
                                isSharedWrap={
                                    isShared === undefined
                                        ? undefined
                                        : {
                                              isShared,
                                              "onIsSharedValueChange":
                                                  launcher.changeIsShared
                                          }
                                }
                                onRequestLaunch={launcher.launch}
                                onRequestCancel={onRequestCancel}
                                onRequestRestoreAllDefault={
                                    areAllFieldsDefault
                                        ? undefined
                                        : launcher.restoreAllDefault
                                }
                                onRequestCopyLaunchUrl={
                                    areAllFieldsDefault || env.DISABLE_AUTO_LAUNCH
                                        ? undefined
                                        : onRequestCopyLaunchUrl
                                }
                                isLaunchable={isLaunchable}
                            />
                            {Object.keys(indexedFormFields).map(
                                dependencyNamePackageNameOrGlobal => (
                                    <LauncherConfigurationCard
                                        key={dependencyNamePackageNameOrGlobal}
                                        dependencyNamePackageNameOrGlobal={
                                            dependencyNamePackageNameOrGlobal
                                        }
                                        {...indexedFormFields[
                                            dependencyNamePackageNameOrGlobal
                                        ]}
                                        onFormValueChange={launcher.changeFormFieldValue}
                                        formFieldsIsWellFormed={formFieldsIsWellFormed}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <LauncherDialogs
                evtAcknowledgeSharingOfConfigConfirmDialogOpen={
                    evtAcknowledgeSharingOfConfigConfirmDialogOpen
                }
                evtAutoLaunchDisabledDialogOpen={evtAutoLaunchDisabledDialogOpen}
                evtSensitiveConfigurationDialogOpen={evtSensitiveConfigurationDialogOpen}
                evtNoLongerBookmarkedDialogOpen={evtNoLongerBookmarkedDialogOpen}
            />
        </>
    );
}

export const { i18n } = declareComponentKeys<
    | "header text1"
    | "header text2"
    | {
          K: "chart sources";
          P: {
              chartName: string;
              urls: string[];
          };
          R: JSX.Element;
      }
    | "download as script"
    | {
          K: "api logs help body";
          P: {
              k8CredentialsHref: string | undefined;
              myServicesHref: string;
              interfacePreferenceHref: string;
          };
          R: JSX.Element;
      }
>()({ Launcher });

const useStyles = tss
    .withParams<{ rootHeight: number; isCommandBarEnabled: boolean }>()
    .withName({ Launcher })
    .create(({ theme, rootHeight, isCommandBarEnabled }) => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column"
        },
        "bodyWrapper": {
            "flex": 1,
            "overflow": "hidden"
        },
        "body": {
            "height": "100%",
            "overflow": "auto",
            "paddingTop": !isCommandBarEnabled
                ? 0
                : theme.typography.rootFontSizePx * 1.7 +
                  2 * theme.spacing(2) +
                  theme.spacing(2),
            "position": "relative"
        },
        "wrapperForMawWidth": {
            "maxWidth": 1300,
            "& > *": {
                "marginBottom": theme.spacing(3)
            }
        },
        "commandBar": {
            "position": "absolute",
            "right": 0,
            "width": "min(100%, 1250px)",
            "top": 0,
            "zIndex": 1,
            "transition": "opacity 750ms linear"
        },
        "commandBarWhenExpended": {
            "width": "min(100%, 1450px)",
            "transition": "width 70ms linear"
        },
        "helpDialog": {
            "maxWidth": 800
        },
        "helpDialogBody": {
            "maxHeight": rootHeight,
            "overflow": "auto"
        }
    }));
