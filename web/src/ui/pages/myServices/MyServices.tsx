import { useEffect, useMemo, useState } from "react";
import { tss } from "ui/theme";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useTranslation } from "ui/i18n";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import type { Props as MyServicesCardsProps } from "./MyServicesCards";
import {
    MyServicesRestorableConfigs,
    type Props as MyServicesRestorableConfigsProps
} from "./MyServicesRestorableConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreFunctions, useCoreState, selectors } from "core";
import { routes } from "ui/routes";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { CommandBar } from "ui/shared/CommandBar";
import { useDomRect } from "powerhooks/useDomRect";
import {
    MyServicesConfirmDeleteDialog,
    type Props as MyServicesConfirmDeleteDialogProps
} from "./MyServicesConfirmDeleteDialog";
import { Deferred } from "evt/tools/Deferred";
import { customIcons } from "ui/theme";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyServices(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyServices });
    const { t: tCatalogLauncher } = useTranslation("Launcher");

    /* prettier-ignore */
    const { serviceManager, restorableConfigManager, k8sCredentials, projectConfigs } = useCoreFunctions();
    /* prettier-ignore */
    const { restorableConfigs, chartIconAndFriendlyNameByRestorableConfigIndex } = useCoreState(
        selectors.restorableConfigManager.wrap
    ).wrap;
    /* prettier-ignore */
    const { isUpdating } = useCoreState(selectors.serviceManager.isUpdating);
    const { runningServices } = useCoreState(selectors.serviceManager.runningServices);
    /* prettier-ignore */
    const { deletableRunningServiceHelmReleaseNames } = useCoreState(selectors.serviceManager.deletableRunningServiceHelmReleaseNames);
    /* prettier-ignore */
    const { isThereOwnedSharedServices } = useCoreState(selectors.serviceManager.isThereOwnedSharedServices);
    /* prettier-ignore */
    const { isThereNonOwnedServices } = useCoreState(selectors.serviceManager.isThereNonOwnedServices);

    const { commandLogsEntries } = useCoreState(
        selectors.serviceManager.commandLogsEntries
    );

    const {
        userConfigs: { isCommandBarEnabled }
    } = useCoreState(selectors.userConfigs.userConfigs);

    const onButtonBarClick = useConstCallback(async (buttonId: ButtonId) => {
        switch (buttonId) {
            case "launch":
                routes.catalog().push();
                return;
            case "refresh":
                serviceManager.update();
                return;
            case "trash":
                const dDoProceed = new Deferred<boolean>();

                evtConfirmDeleteDialogOpen.post({
                    isThereOwnedSharedServices,
                    "resolveDoProceed": dDoProceed.resolve
                });

                if (!(await dDoProceed.pr)) {
                    return;
                }

                deletableRunningServiceHelmReleaseNames.map(helmReleaseName =>
                    serviceManager.stopService({ helmReleaseName })
                );

                return;
        }
    });

    useEffect(() => {
        const { setInactive } = serviceManager.setActive();
        return () => setInactive();
    }, []);

    const { isSavedConfigsExtended } = route.params;

    const {
        rootRef: belowHeaderRef,
        buttonBarRef,
        commandBarTop,
        commandBarMaxHeight
    } = useCommandBarPositioning();

    const {
        domRect: { height: bellowHeaderHeight }
    } = useDomRect({ "ref": belowHeaderRef });

    const { classes, cx } = useStyles({
        isSavedConfigsExtended,
        commandBarTop,
        isCommandBarEnabled,
        bellowHeaderHeight
    });

    const onRequestToggleIsShortVariant = useConstCallback(() =>
        routes
            .myServices({
                "isSavedConfigsExtended": !isSavedConfigsExtended ? true : undefined
            })
            .push()
    );

    const onRequestDeleteRestorableConfig = useConstCallback<
        MyServicesRestorableConfigsProps["onRequestDelete"]
    >(({ restorableConfigIndex }) => {
        restorableConfigManager.deleteRestorableConfig({
            "restorableConfig": restorableConfigs[restorableConfigIndex]
        });
    });

    const restorableConfigEntires = useMemo(
        (): MyServicesRestorableConfigsProps["entries"] =>
            restorableConfigs.map((restorableConfig, restorableConfigIndex) => {
                const buildLink = (autoLaunch: boolean) =>
                    routes.launcher({
                        "catalogId": restorableConfig.catalogId,
                        "chartName": restorableConfig.chartName,
                        "version": restorableConfig.chartVersion,
                        "formFieldsValueDifferentFromDefault":
                            restorableConfig.formFieldsValueDifferentFromDefault,
                        "autoLaunch": autoLaunch ? true : undefined
                    }).link;

                const { chartIconUrl, friendlyName } =
                    chartIconAndFriendlyNameByRestorableConfigIndex[
                        restorableConfigIndex
                    ];

                return {
                    restorableConfigIndex,
                    chartIconUrl,
                    friendlyName,
                    "launchLink": buildLink(true),
                    "editLink": buildLink(false)
                };
            }),
        [restorableConfigs, chartIconAndFriendlyNameByRestorableConfigIndex]
    );

    const cards = useMemo(
        (): MyServicesCardsProps["cards"] | undefined =>
            runningServices?.map(
                ({
                    helmReleaseName,
                    chartIconUrl,
                    friendlyName,
                    chartName,
                    urls,
                    startedAt,
                    monitoringUrl,
                    isStarting,
                    vaultTokenExpirationTime,
                    s3TokenExpirationTime,
                    hasPostInstallInstructions,
                    ...rest
                }) => ({
                    helmReleaseName,
                    chartIconUrl,
                    friendlyName,
                    chartName,
                    "openUrl": urls[0],
                    monitoringUrl,
                    "startTime": isStarting ? undefined : startedAt,
                    hasPostInstallInstructions,
                    "isShared": rest.isShared,
                    "isOwned": rest.isOwned,
                    "ownerUsername": rest.isOwned ? undefined : rest.ownerUsername,
                    vaultTokenExpirationTime,
                    s3TokenExpirationTime
                })
            ),
        [runningServices]
    );

    const evtMyServiceCardsAction = useConst(() =>
        Evt.create<UnpackEvt<MyServicesCardsProps["evtAction"]>>()
    );

    useEffect(() => {
        const { autoOpenHelmReleaseName } = route.params;

        if (autoOpenHelmReleaseName === undefined) {
            return;
        }

        const runningService = (runningServices ?? []).find(
            ({ helmReleaseName }) => helmReleaseName === autoOpenHelmReleaseName
        );

        if (runningService === undefined) {
            return;
        }

        routes
            .myServices({
                ...route.params,
                "isSavedConfigsExtended": route.params.isSavedConfigsExtended
                    ? true
                    : undefined,
                "autoOpenHelmReleaseName": undefined
            })
            .replace();

        evtMyServiceCardsAction.post({
            "action": "TRIGGER SHOW POST INSTALL INSTRUCTIONS",
            "helmReleaseName": runningService.helmReleaseName
        });
    }, [route.params.autoOpenHelmReleaseName, runningServices]);

    const catalogExplorerLink = useMemo(() => routes.catalog().link, []);

    const evtConfirmDeleteDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<MyServicesConfirmDeleteDialogProps["evtOpen"]>>()
    );

    const onRequestDelete = useConstCallback<MyServicesCardsProps["onRequestDelete"]>(
        async ({ helmReleaseName }) => {
            const dDoProceed = new Deferred<boolean>();

            evtConfirmDeleteDialogOpen.post({
                isThereOwnedSharedServices,
                "resolveDoProceed": dDoProceed.resolve
            });

            if (!(await dDoProceed.pr)) {
                return;
            }

            serviceManager.stopService({ helmReleaseName });
        }
    );

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.servicesSvgUrl}
                title={t("text1")}
                helpTitle={t("text2")}
                helpContent={t("text3")}
                helpIcon="sentimentSatisfied"
            />
            <div className={classes.belowHeader} ref={belowHeaderRef}>
                <div ref={buttonBarRef}>
                    <MyServicesButtonBar
                        onClick={onButtonBarClick}
                        isThereNonOwnedServicesShown={isThereNonOwnedServices}
                        isThereDeletableServices={
                            deletableRunningServiceHelmReleaseNames.length !== 0
                        }
                    />
                </div>
                {isCommandBarEnabled && (
                    <CommandBar
                        classes={{
                            "root": classes.commandBar,
                            "rootWhenExpended": classes.commandBarWhenExpended,
                            "helpDialog": classes.helpDialog
                        }}
                        entries={commandLogsEntries}
                        maxHeight={commandBarMaxHeight}
                        helpDialog={{
                            "body": (
                                <div className={classes.helpDialogBody}>
                                    {tCatalogLauncher("api logs help body", {
                                        "k8CredentialsHref":
                                            !k8sCredentials.getIsAvailable()
                                                ? undefined
                                                : routes.account({
                                                      "tabId": "k8sCredentials"
                                                  }).href,
                                        "myServicesHref": routes.myServices().href,
                                        "interfacePreferenceHref": routes.account({
                                            "tabId": "user-interface"
                                        }).href
                                    })}
                                </div>
                            )
                        }}
                    />
                )}
                <div className={classes.cardsAndSavedConfigs}>
                    <>
                        {!isSavedConfigsExtended && (
                            <MyServicesCards
                                isUpdating={isUpdating}
                                className={classes.cards}
                                cards={cards}
                                onRequestDelete={onRequestDelete}
                                catalogExplorerLink={catalogExplorerLink}
                                evtAction={evtMyServiceCardsAction}
                                getProjectServicePassword={
                                    projectConfigs.getServicesPassword
                                }
                                getEnv={serviceManager.getEnv}
                                getPostInstallInstructions={
                                    serviceManager.getPostInstallInstructions
                                }
                            />
                        )}
                        <MyServicesRestorableConfigs
                            isShortVariant={!isSavedConfigsExtended}
                            entries={restorableConfigEntires}
                            className={classes.savedConfigs}
                            onRequestDelete={onRequestDeleteRestorableConfig}
                            onRequestToggleIsShortVariant={onRequestToggleIsShortVariant}
                        />
                    </>
                </div>
                <MyServicesConfirmDeleteDialog evtOpen={evtConfirmDeleteDialogOpen} />
            </div>
        </div>
    );
}

function useCommandBarPositioning() {
    const {
        domRect: { bottom: rootBottom },
        ref: rootRef
    } = useDomRect();

    // NOTE: To avoid https://reactjs.org/docs/hooks-reference.html#useimperativehandle
    const {
        domRect: { height: buttonBarHeight, bottom: buttonBarBottom },
        ref: buttonBarRef
    } = useDomRect();

    const [commandBarTop, setCommandBarTop] = useState<number>(0);

    const [commandBarMaxHeight, setCommandBarMaxHeight] = useState<number>(0);

    useEffect(() => {
        setCommandBarTop(buttonBarHeight);

        setCommandBarMaxHeight(rootBottom - buttonBarBottom - 30);
    }, [buttonBarHeight, buttonBarBottom, rootBottom]);

    return {
        rootRef,
        buttonBarRef,
        commandBarTop,
        commandBarMaxHeight
    };
}

export const { i18n } = declareComponentKeys<
    "text1" | "text2" | "text3" | "running services"
>()({ MyServices });

const useStyles = tss
    .withName({ MyServices })
    .withParams<{
        isCommandBarEnabled: boolean;
        commandBarTop: number;
        isSavedConfigsExtended: boolean;
        bellowHeaderHeight: number;
    }>()
    .create(
        ({
            theme,
            isCommandBarEnabled,
            isSavedConfigsExtended,
            commandBarTop,
            bellowHeaderHeight
        }) => ({
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
            "cardsAndSavedConfigs": {
                "overflow": "hidden",
                "flex": 1,
                "display": "flex",
                "& > *": {
                    "height": "100%"
                }
            },
            ...(() => {
                const ratio = 0.65;

                return {
                    "cards": {
                        "flex": ratio,
                        "marginRight": theme.spacing(5)
                    },
                    "savedConfigs": {
                        "flex": isSavedConfigsExtended ? 1 : 1 - ratio,
                        "paddingRight": "2%",
                        //NOTE: It's not great to have a fixed width here but measuring would needlessly complexity the code too much.
                        "marginTop": isCommandBarEnabled ? 40 : undefined
                    }
                };
            })(),
            "commandBar": {
                "position": "absolute",
                "right": 0,
                "top": commandBarTop,
                "zIndex": 1,
                "opacity": commandBarTop === 0 ? 0 : 1,
                "transition": "opacity 750ms linear",
                "width": "min(100%, 900px)"
            },
            "commandBarWhenExpended": {
                "width": "min(100%, 1350px)",
                "transition": "width 70ms linear"
            },
            "helpDialog": {
                "maxWidth": 800
            },
            "helpDialogBody": {
                "maxHeight": bellowHeaderHeight,
                "overflow": "auto"
            }
        })
    );
