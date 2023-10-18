import { useEffect } from "react";
import { useTranslation } from "ui/i18n";
import { PageHeader, tss } from "ui/theme";
import { useCoreState, selectors, useCoreFunctions, useCoreEvts } from "core";
import { useStateRef } from "powerhooks/useStateRef";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useDomRect } from "powerhooks/useDomRect";
import { useConst } from "powerhooks/useConst";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { useSplashScreen } from "onyxia-ui";
import { useEvt } from "evt/hooks";
import { routes, getPreviousRouteName } from "ui/routes";
import { getIsAutoLaunchDisabled } from "ui/env";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { Evt, type UnpackEvt } from "evt";
import { LauncherDialogs, type Props as LauncherDialogsProps } from "./LauncherDialogs";
import { CommandBar } from "ui/shared/CommandBar";
import { saveAs } from "file-saver";
import { LauncherMainCard } from "./LauncherMainCard";
import { LauncherConfigurationCard } from "./LauncherConfigurationCard";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function Launcher(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Launcher });

    const {
        evtAutoLaunchDisabledDialogOpen,
        evtSensitiveConfigurationDialogOpen,
        evtNoLongerBookmarkedDialogOpen,
        evtOverwriteConfigurationConfirmDialogOpen
    } = useConst(() => ({
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
            >(),
        "evtOverwriteConfigurationConfirmDialogOpen":
            Evt.create<
                UnpackEvt<
                    LauncherDialogsProps["evtOverwriteConfigurationConfirmDialogOpen"]
                >
            >()
    }));

    const {
        isReady,
        friendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorableConfig,
        isRestorableConfigSaved,
        areAllFieldsDefault,
        chartName,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        chartSourceUrls
    } = useCoreState(selectors.launcher.wrap).wrap;

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const { launcher, restorableConfigManager, k8sCredentials } = useCoreFunctions();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        const { catalogId, chartName, formFieldsValueDifferentFromDefault } =
            route.params;

        launcher.initialize({
            catalogId,
            chartName,
            formFieldsValueDifferentFromDefault
        });

        showSplashScreen({ "enableTransparency": true });

        return () => launcher.reset();
    }, []);

    const { evtLauncher } = useCoreEvts();

    useEvt(
        ctx => {
            evtLauncher.$attach(
                action => (action.actionName === "initialized" ? [action] : null),
                ctx,
                ({ sensitiveConfigurations }) => {
                    auto_launch: {
                        if (!route.params.autoLaunch) {
                            break auto_launch;
                        }

                        if (
                            getIsAutoLaunchDisabled() &&
                            //If auto launch from myServices the user is launching one of his service, it's safe
                            getPreviousRouteName() !== "myServices"
                        ) {
                            evtAutoLaunchDisabledDialogOpen.post();
                            break auto_launch;
                        }

                        if (sensitiveConfigurations.length !== 0) {
                            evtSensitiveConfigurationDialogOpen.post({
                                sensitiveConfigurations,
                                "resolveDoProceedToLaunch": doProceedToLaunch => {
                                    if (!doProceedToLaunch) {
                                        return;
                                    }

                                    launcher.launch();
                                }
                            });

                            break auto_launch;
                        }

                        launcher.launch();
                    }

                    hideSplashScreen();
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
                ({ serviceId }) => {
                    hideSplashScreen();
                    routes.myServices({ "autoLaunchServiceId": serviceId }).push();
                }
            );
        },
        [evtLauncher]
    );

    const {
        userConfigs: { isCommandBarEnabled }
    } = useCoreState(selectors.userConfigs.userConfigs);

    useEffect(() => {
        if (restorableConfig === undefined) {
            return;
        }

        const { catalogId, chartName, formFieldsValueDifferentFromDefault } =
            restorableConfig;

        routes
            .launcher({
                catalogId,
                chartName,
                formFieldsValueDifferentFromDefault,
                "autoLaunch": route.params.autoLaunch
            })
            .replace();
    }, [restorableConfig]);

    const onRequestCancel = useConstCallback(() =>
        routes.catalog({ "catalogId": route.params.catalogId }).push()
    );

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        navigator.clipboard.writeText(window.location.href)
    );

    const onRequestToggleBookmark = useConstCallback(async () => {
        assert(restorableConfig !== undefined);

        if (isRestorableConfigSaved) {
            restorableConfigManager.deleteRestorableConfig({ restorableConfig });
        } else {
            if (
                restorableConfigManager.getIsThereASavedConfigWithSameFriendlyName({
                    restorableConfig
                })
            ) {
                const dDoOverwriteConfiguration = new Deferred<boolean>();

                evtOverwriteConfigurationConfirmDialogOpen.post({
                    friendlyName,
                    "resolveDoOverwriteConfiguration": dDoOverwriteConfiguration.resolve
                });

                if (!(await dDoOverwriteConfiguration.pr)) {
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
                    mainIcon="catalog"
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
                                isBookmarked={isRestorableConfigSaved}
                                myServicesSavedConfigsExtendedLink={
                                    routes.myServices({
                                        "isSavedConfigsExtended": true
                                    }).link
                                }
                                onRequestToggleBookmark={onRequestToggleBookmark}
                                friendlyName={friendlyName}
                                isShared={isShared}
                                onFriendlyNameChange={launcher.changeFriendlyName}
                                onIsSharedValueChange={launcher.changeIsShared}
                                onRequestLaunch={launcher.launch}
                                onRequestCancel={onRequestCancel}
                                onRequestRestoreAllDefault={
                                    areAllFieldsDefault
                                        ? undefined
                                        : launcher.restoreAllDefault
                                }
                                onRequestCopyLaunchUrl={
                                    areAllFieldsDefault
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
                evtAutoLaunchDisabledDialogOpen={evtAutoLaunchDisabledDialogOpen}
                evtSensitiveConfigurationDialogOpen={evtSensitiveConfigurationDialogOpen}
                evtNoLongerBookmarkedDialogOpen={evtNoLongerBookmarkedDialogOpen}
                evtOverwriteConfigurationConfirmDialogOpen={
                    evtOverwriteConfigurationConfirmDialogOpen
                }
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
            "maxWidth": 1200,
            "& > *": {
                "marginBottom": theme.spacing(3)
            }
        },
        "commandBar": {
            "position": "absolute",
            "right": 0,
            "width": "min(100%, 1100px)",
            "top": 0,
            "zIndex": 1,
            "transition": "opacity 750ms linear"
        },
        "commandBarWhenExpended": {
            "width": "min(100%, 1400px)",
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
