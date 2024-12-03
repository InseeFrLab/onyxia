import { useEffect, useState } from "react";
import { useTranslation, useResolveLocalizedString, declareComponentKeys } from "ui/i18n";
import { tss } from "tss";
import { useCoreState, useCore } from "core";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useDomRect } from "powerhooks/useDomRect";
import { useConst } from "powerhooks/useConst";
import type { PageRoute } from "./route";
import { useSplashScreen } from "onyxia-ui";
import { useEvt } from "evt/hooks";
import { routes, getPreviousRouteName } from "ui/routes";
import { env } from "env";
import { assert, type Equals } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";
import { Evt, type UnpackEvt } from "evt";
import { LauncherDialogs, type Props as LauncherDialogsProps } from "./LauncherDialogs";
import { CommandBar } from "ui/shared/CommandBar";
import { saveAs } from "file-saver";
import { LauncherMainCard } from "./LauncherMainCard";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";
import type { LabeledHelmChartSourceUrls } from "core/usecases/launcher/selectors";
import { RootFormComponent } from "./RootFormComponent/RootFormComponent";
import type { Param0 } from "tsafe";
import type { FormCallbacks } from "./RootFormComponent/FormCallbacks";
import { arrRemoveDuplicates } from "evt/tools/reducers/removeDuplicates";
import { same } from "evt/tools/inDepth/same";

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
        evtAcknowledgeSharingOfConfigConfirmDialogOpen:
            Evt.create<
                UnpackEvt<
                    LauncherDialogsProps["evtAcknowledgeSharingOfConfigConfirmDialogOpen"]
                >
            >(),
        evtAutoLaunchDisabledDialogOpen:
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtAutoLaunchDisabledDialogOpen"]>
            >(),
        evtNoLongerBookmarkedDialogOpen:
            Evt.create<
                UnpackEvt<LauncherDialogsProps["evtNoLongerBookmarkedDialogOpen"]>
            >(),
        evtMaybeAcknowledgeConfigVolatilityDialogOpen:
            Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>()
    }));

    const {
        isReady,
        friendlyName,
        isShared,
        chartName,
        chartVersion,
        availableChartVersions,
        restorableConfig,
        rootForm,
        willOverwriteExistingConfigOnSave,
        isRestorableConfigSaved,
        isDefaultConfiguration,
        catalogName,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        groupProjectName,
        s3ConfigSelect,
        labeledHelmChartSourceUrls
    } = useCoreState("launcher", "main");

    const { launcher, restorableConfigManagement, k8sCodeSnippets } = useCore().functions;

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        showSplashScreen({ enableTransparency: true });

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
            restorableConfig: {
                catalogId: route.params.catalogId,
                chartName: route.params.chartName,
                chartVersion: route.params.version,
                friendlyName: route.params.name,
                isShared: route.params.shared,
                s3ConfigId: route.params.s3,
                helmValuesPatch: route.params.helmValuesPatch
            },
            autoLaunch
        });

        return cleanup;
    }, []);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        const {
            catalogId,
            chartName,
            chartVersion,
            friendlyName,
            isShared,
            s3ConfigId,
            helmValuesPatch,
            ...rest
        } = restorableConfig;

        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        assert<Equals<typeof rest, {}>>();

        routes[route.name]({
            catalogId,
            chartName,
            version: chartVersion,
            name: friendlyName,
            shared: isShared,
            s3: s3ConfigId,
            helmValuesPatch
        }).replace();
    }, [restorableConfig]);

    const { evtLauncher } = useCore().evts;

    useEvt(
        ctx =>
            evtLauncher
                .pipe(ctx)
                .attach(
                    event => event.eventName === "initialized",
                    () => hideSplashScreen()
                )
                .attach(
                    event => event.eventName === "launchStarted",
                    () => showSplashScreen({ enableTransparency: true })
                )
                .$attach(
                    event => (event.eventName === "launchCompleted" ? [event] : null),
                    ({ helmReleaseName }) => {
                        hideSplashScreen();
                        routes
                            .myServices({ autoOpenHelmReleaseName: helmReleaseName })
                            .push();
                    }
                ),
        [evtLauncher]
    );

    const onRequestCancel = useConstCallback(() =>
        routes.catalog({ catalogId: route.params.catalogId }).push()
    );

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        navigator.clipboard.writeText(
            window.location.origin +
                routes.launcher({
                    ...route.params,
                    autoLaunch: true
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
                    resolve: ({ doProceed }) => dDoProceed.resolve(doProceed)
                });

                if (!(await dDoProceed.pr)) {
                    return;
                }
            }

            if (groupProjectName !== undefined) {
                const doProceed = new Deferred<boolean>();

                evtAcknowledgeSharingOfConfigConfirmDialogOpen.post({
                    groupProjectName,
                    resolveDoProceed: doProceed.resolve
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
        ref: rootRef,
        domRect: { height: rootHeight }
    } = useDomRect();

    const { classes, cx } = useStyles({
        isCommandBarEnabled: commandLogsEntries !== undefined
    });

    const { myServicesSavedConfigsExtendedLink, projectS3ConfigLink } = useConst(() => ({
        myServicesSavedConfigsExtendedLink: routes.myServices({
            isSavedConfigsExtended: true
        }).link,

        projectS3ConfigLink: routes.projectSettings({
            tabId: "s3-configs"
        }).link
    }));

    const { resolveLocalizedString } = useResolveLocalizedString({
        labelWhenMismatchingLanguage: true
    });

    const { erroredFormFields, onFieldErrorChange, removeAllErroredFormFields } =
        (function useClosure() {
            const [erroredFormFields, setErroredFormFields] = useState<
                (string | number)[][]
            >([]);

            const onFieldErrorChange = useConstCallback(
                ({
                    helmValuesPath,
                    hasError
                }: Param0<FormCallbacks["onFieldErrorChange"]>) => {
                    const erroredFormFields_new = [...erroredFormFields];

                    if (hasError) {
                        erroredFormFields_new.push(helmValuesPath);
                        arrRemoveDuplicates(erroredFormFields_new, (a, b) => same(a, b));
                    } else {
                        const index = erroredFormFields_new.findIndex(erroredFormField =>
                            same(erroredFormField, helmValuesPath)
                        );

                        if (index === -1) {
                            return;
                        }

                        erroredFormFields_new.splice(index, 1);
                    }

                    setErroredFormFields(erroredFormFields_new);
                }
            );

            const removeAllErroredFormFields = useConstCallback(
                (params: { startingWithHelmValuesPath: (string | number)[] }) => {
                    const { startingWithHelmValuesPath } = params;

                    const erroredFormFields_new = erroredFormFields.filter(
                        erroredFormField => {
                            if (
                                erroredFormField.length <
                                startingWithHelmValuesPath.length
                            ) {
                                return true;
                            }

                            for (let i = 0; i < startingWithHelmValuesPath.length; i++) {
                                if (
                                    erroredFormField[i] !== startingWithHelmValuesPath[i]
                                ) {
                                    return true;
                                }
                            }

                            return false;
                        }
                    );

                    setErroredFormFields(erroredFormFields_new);
                }
            );

            return { erroredFormFields, onFieldErrorChange, removeAllErroredFormFields };
        })();

    const onRemove = useConstCallback<FormCallbacks["onRemove"]>(
        ({ helmValuesPath, index }) => {
            removeAllErroredFormFields({ startingWithHelmValuesPath: helmValuesPath });

            launcher.removeArrayItem({ helmValuesPath, index });
        }
    );

    if (!isReady) {
        return null;
    }

    return (
        <>
            <div ref={rootRef} className={cx(classes.root, className)}>
                {commandLogsEntries !== undefined && (
                    <CommandBar
                        classes={{
                            root: classes.commandBar,
                            rootWhenExpended: classes.commandBarWhenExpended
                        }}
                        maxHeight={rootHeight - 30}
                        entries={commandLogsEntries}
                        downloadButton={{
                            tooltipTitle: t("download as script"),
                            onClick: () =>
                                saveAs(
                                    new Blob([launchScript.content], {
                                        type: "text/plain;charset=utf-8"
                                    }),
                                    launchScript.fileBasename
                                )
                        }}
                        helpDialog={{
                            body: t("api logs help body", {
                                k8CredentialsHref: !k8sCodeSnippets.getIsAvailable()
                                    ? undefined
                                    : routes.account({
                                          tabId: "k8sCodeSnippets"
                                      }).href,
                                myServicesHref: routes.myServices().href,
                                interfacePreferenceHref: routes.account({
                                    tabId: "user-interface"
                                }).href
                            })
                        }}
                    />
                )}
                <LauncherMainCard
                    className={classes.mainCard}
                    chartName={chartName}
                    chartSourceLinksNode={t("sources", {
                        helmChartName: chartName,
                        helmChartRepositoryName: resolveLocalizedString(catalogName),
                        labeledHelmChartSourceUrls
                    })}
                    chartIconUrl={chartIconUrl}
                    willOverwriteExistingConfigOnSave={willOverwriteExistingConfigOnSave}
                    isBookmarked={isRestorableConfigSaved}
                    chartVersion={chartVersion}
                    availableChartVersions={availableChartVersions}
                    onChartVersionChange={onChartVersionChange}
                    catalogName={catalogName}
                    labeledHelmChartSourceUrls={labeledHelmChartSourceUrls}
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
                                  onIsSharedValueChange: launcher.changeIsShared
                              }
                    }
                    onRequestLaunch={launcher.launch}
                    onRequestCancel={onRequestCancel}
                    onRequestRestoreAllDefault={
                        isDefaultConfiguration ? undefined : launcher.restoreAllDefault
                    }
                    onRequestCopyLaunchUrl={
                        isDefaultConfiguration || env.DISABLE_AUTO_LAUNCH
                            ? undefined
                            : onRequestCopyLaunchUrl
                    }
                    s3ConfigsSelect={
                        s3ConfigSelect === undefined
                            ? undefined
                            : {
                                  projectS3ConfigLink,
                                  selectedOption: s3ConfigSelect.selectedOptionValue,
                                  options: s3ConfigSelect.options,
                                  onSelectedS3ConfigChange: launcher.changeS3Config
                              }
                    }
                    erroredFormFields={erroredFormFields}
                />
                <div className={classes.rootFormWrapper}>
                    <RootFormComponent
                        className={classes.rootForm}
                        rootForm={rootForm}
                        callbacks={{
                            onAdd: launcher.addArrayItem,
                            onChange: launcher.changeFormFieldValue,
                            onRemove,
                            onFieldErrorChange
                        }}
                    />
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
    | {
          K: "sources";
          P: {
              helmChartName: string;
              helmChartRepositoryName: JSX.Element;
              labeledHelmChartSourceUrls: LabeledHelmChartSourceUrls;
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
    .create(({ theme, isCommandBarEnabled }) => {
        const MAX_WIDTH = 1250;

        return {
            root: {
                height: "100%",
                paddingTop: !isCommandBarEnabled
                    ? 0
                    : theme.typography.rootFontSizePx * 1.7 +
                      2 * theme.spacing(2) +
                      theme.spacing(2),
                position: "relative",
                display: "flex",
                flexDirection: "column"
            },
            commandBar: {
                position: "absolute",
                right: 0,
                width: "min(100%, 1250px)",
                top: 0,
                zIndex: 1,
                transition: "opacity 750ms linear"
            },
            commandBarWhenExpended: {
                width: "min(100%, 1450px)",
                transition: "width 70ms linear"
            },
            mainCard: {
                maxWidth: MAX_WIDTH
            },
            rootFormWrapper: {
                marginTop: theme.spacing(3),
                flex: 1,
                overflow: "auto"
            },
            rootForm: {
                maxWidth: MAX_WIDTH
            }
        };
    });
