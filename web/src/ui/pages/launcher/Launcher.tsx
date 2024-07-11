import { useEffect } from "react";
import { useTranslation, useResolveLocalizedString, declareComponentKeys } from "ui/i18n";
import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useCoreState, useCore } from "core";
import { useStateRef } from "powerhooks/useStateRef";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useDomRect } from "powerhooks/useDomRect";
import { useConst } from "powerhooks/useConst";
import type { PageRoute } from "./route";
import { useSplashScreen } from "onyxia-ui";
import { useEvt } from "evt/hooks";
import { routes, getPreviousRouteName } from "ui/routes";
import { env } from "env";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { Evt, type UnpackEvt } from "evt";
import { LauncherDialogs, type Props as LauncherDialogsProps } from "./LauncherDialogs";
import { CommandBar } from "ui/shared/CommandBar";
import { saveAs } from "file-saver";
import { LauncherMainCard } from "./LauncherMainCard";
import { LauncherConfigurationCard } from "./LauncherConfigurationCard";
import { customIcons } from "ui/theme";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";
import type { SourceUrls } from "core/usecases/launcher/selectors";

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
        evtNoLongerBookmarkedDialogOpen,
        evtMaybeAcknowledgeConfigVolatilityDialogOpen
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
        "evtNoLongerBookmarkedDialogOpen":
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtNoLongerBookmarkedDialogOpen"]>
            >(),
        "evtMaybeAcknowledgeConfigVolatilityDialogOpen":
            Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>()
    }));

    const {
        isReady,
        friendlyName,
        willOverwriteExistingConfigOnSave,
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
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        groupProjectName,
        s3ConfigSelect,
        sourceUrls
    } = useCoreState("launcher", "main");

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const { launcher, restorableConfigManagement, k8sCodeSnippets } = useCore().functions;

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        const {
            catalogId,
            chartName,
            version: chartVersion,
            "name": friendlyName,
            shared: isShared,
            helmValuesPatch
        } = route.params;

        showSplashScreen({ "enableTransparency": true });

        let autoLaunch = route.params.autoLaunch ?? false;

        disable_auto_launch: {
            if (!autoLaunch) {
                break disable_auto_launch;
            }

            if (!env.DISABLE_AUTO_LAUNCH) {
                break disable_auto_launch;
            }

            if (getPreviousRouteName() === "myServices") {
                break disable_auto_launch;
            }

            evtAutoLaunchDisabledDialogOpen.postAsyncOnceHandled();

            autoLaunch = false;
        }

        const { cleanup } = launcher.initialize({
            catalogId,
            chartName,
            chartVersion,
            formFieldsValueDifferentFromDefault,
            friendlyName,
            isShared,
            autoLaunch
        });

        return cleanup;
    }, []);

    const { evtLauncher } = useCore().evts;

    const routeUpdateReplace = useConstCallback(
        (params: Partial<(typeof route)["params"]>) => {
            routes[route.name]({
                ...route.params,
                ...params
            }).replace();
        }
    );

    useEvt(
        ctx =>
            evtLauncher
                .pipe(ctx)
                .$attach(
                    event =>
                        event.eventName === "restorableServiceConfigChanged"
                            ? [event]
                            : null,
                    ({ restorableServiceConfig }) =>
                        routeUpdateReplace({
                            "version": restorableServiceConfig.chartVersion,
                            "name": restorableServiceConfig.friendlyName,
                            "shared": restorableServiceConfig.isShared,
                            "helmValuesPatch": restorableServiceConfig.helmValuesPatch
                        })
                )
                .attach(
                    event => event.eventName === "initialized",
                    () => hideSplashScreen()
                )
                .attach(
                    event => event.eventName === "launchStarted",
                    () => showSplashScreen({ "enableTransparency": true })
                )
                .$attach(
                    event => (event.eventName === "launchCompleted" ? [event] : null),
                    ({ helmReleaseName }) => {
                        hideSplashScreen();
                        routes
                            .myServices({ "autoOpenHelmReleaseName": helmReleaseName })
                            .push();
                    }
                ),
        [evtLauncher]
    );

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
            restorableConfigManagement.deleteRestorableConfig({ restorableConfig });
        } else {
            {
                const dDoProceed = new Deferred<boolean>();

                evtMaybeAcknowledgeConfigVolatilityDialogOpen.post({
                    "resolve": ({ doProceed }) => dDoProceed.resolve(doProceed)
                });

                if (!(await dDoProceed.pr)) {
                    return;
                }
            }

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

            restorableConfigManagement.saveRestorableConfig({ restorableConfig });
        }
    });

    const onChartVersionChange = useConstCallback((chartVersion: string) =>
        launcher.changeChartVersion({ chartVersion })
    );

    const {
        domRect: { height: rootHeight }
    } = useDomRect({
        "ref": scrollableDivRef
    });

    const { classes, cx, css } = useStyles({
        "isCommandBarEnabled": commandLogsEntries !== undefined
    });

    const { myServicesSavedConfigsExtendedLink, projectS3ConfigLink } = useConst(() => ({
        "myServicesSavedConfigsExtendedLink": routes.myServices({
            "isSavedConfigsExtended": true
        }).link,

        "projectS3ConfigLink": routes.projectSettings({
            "tabId": "s3-configs"
        }).link
    }));

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
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
                    helpContent={t("sources", {
                        "helmChartName": chartName,
                        "helmChartRepositoryName": resolveLocalizedString(catalogName),
                        sourceUrls
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
                        {commandLogsEntries !== undefined && (
                            <CommandBar
                                classes={{
                                    "root": classes.commandBar,
                                    "rootWhenExpended": classes.commandBarWhenExpended
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
                                    "body": t("api logs help body", {
                                        "k8CredentialsHref":
                                            !k8sCodeSnippets.getIsAvailable()
                                                ? undefined
                                                : routes.account({
                                                      "tabId": "k8sCodeSnippets"
                                                  }).href,
                                        "myServicesHref": routes.myServices().href,
                                        "interfacePreferenceHref": routes.account({
                                            "tabId": "user-interface"
                                        }).href
                                    })
                                }}
                            />
                        )}
                        <div className={classes.wrapperForMawWidth}>
                            <LauncherMainCard
                                chartName={chartName}
                                chartIconUrl={chartIconUrl}
                                willOverwriteExistingConfigOnSave={
                                    willOverwriteExistingConfigOnSave
                                }
                                isBookmarked={isRestorableConfigSaved}
                                chartVersion={chartVersion}
                                availableChartVersions={availableChartVersions}
                                onChartVersionChange={onChartVersionChange}
                                catalogName={catalogName}
                                sourceUrls={sourceUrls}
                                myServicesSavedConfigsExtendedLink={
                                    myServicesSavedConfigsExtendedLink
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
                                s3ConfigsSelect={
                                    s3ConfigSelect === undefined
                                        ? undefined
                                        : {
                                              projectS3ConfigLink,
                                              "selectedOption":
                                                  s3ConfigSelect.selectedOption,
                                              "options": s3ConfigSelect.options,
                                              "onSelectedS3ConfigChange":
                                                  launcher.useSpecificS3Config
                                          }
                                }
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
                evtNoLongerBookmarkedDialogOpen={evtNoLongerBookmarkedDialogOpen}
            />
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
}

const { i18n } = declareComponentKeys<
    | "header text1"
    | {
          K: "sources";
          P: {
              helmChartName: string;
              helmChartRepositoryName: JSX.Element;
              sourceUrls: SourceUrls;
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
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<{ isCommandBarEnabled: boolean }>()
    .withName({ Launcher })
    .create(({ theme, isCommandBarEnabled }) => ({
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
        }
    }));
