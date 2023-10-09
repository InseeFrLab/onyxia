/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, memo } from "react";
import type { RefObject } from "react";
import { tss, useStyles as useDefaultStyles, Button, Text } from "ui/theme";
import { routes, getPreviousRouteName } from "ui/routes";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import { CatalogLauncherConfigurationCard } from "./CatalogLauncherConfigurationCard";
import { useCoreState, selectors, useCoreFunctions, useCoreEvts } from "core";
import { useConstCallback } from "powerhooks/useConstCallback";
import { assert } from "tsafe/assert";
import { useSplashScreen } from "onyxia-ui";
import { Dialog } from "onyxia-ui/Dialog";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";
import type { NonPostableEvt } from "evt";
import type { FormFieldValue } from "core/usecases/launcher/FormField";
import { useEvt } from "evt/hooks/useEvt";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { Markdown } from "onyxia-ui/Markdown";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import { getIsAutoLaunchDisabled } from "ui/env";
import { CommandBar } from "ui/shared/CommandBar";
import { useDomRect } from "powerhooks/useDomRect";
import { saveAs } from "file-saver";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogLauncher = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const {
        launcher,
        restorablePackageConfig: restorablePackageConfigFunctions,
        k8sCredentials
    } = useCoreFunctions();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
            route.params;

        launcher.initialize({
            catalogId,
            packageName,
            formFieldsValueDifferentFromDefault
        });

        showSplashScreen({ "enableTransparency": true });

        return () => launcher.reset();
    }, []);

    const { evtLauncher } = useCoreEvts();

    useEvt(ctx => {
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
                            sensitiveConfigurations
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
    }, []);

    const {
        isReady,
        friendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorablePackageConfig,
        areAllFieldsDefault,
        packageName,
        icon,
        launchScript,
        commandLogsEntries
    } = useCoreState(selectors.launcher.launcherWrap).launcherWrap;

    const {
        userConfigs: { isCommandBarEnabled }
    } = useCoreState(selectors.userConfigs.userConfigs);

    const { restorablePackageConfigs } = useCoreState(
        selectors.restorablePackageConfig.restorablePackageConfigs
    );

    useEffect(() => {
        if (restorablePackageConfig === undefined) {
            return;
        }

        const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
            restorablePackageConfig;

        routes
            .catalogLauncher({
                catalogId,
                packageName,
                formFieldsValueDifferentFromDefault,
                "autoLaunch": route.params.autoLaunch
            })
            .replace();
    }, [restorablePackageConfig]);

    const [isBookmarked, setIsBookmarked] = useState(false);

    const [isNoLongerBookmarkedDialogOpen, setIsNoLongerBookmarkedDialogOpen] =
        useState(false);

    const onNoLongerBookmarkedDialogClose = useConstCallback(() =>
        setIsNoLongerBookmarkedDialogOpen(false)
    );

    const [overwriteConfigurationDialogState, setOverwriteConfigurationDialogState] =
        useState<
            | {
                  resolveDoOverwriteConfiguration: (
                      doOverwriteConfiguration: boolean
                  ) => void;
                  friendlyName: string;
              }
            | undefined
        >(undefined);

    const onOverwriteConfigurationDialogClickFactory = useCallbackFactory(
        ([action]: ["overwrite" | "cancel"]) => {
            assert(overwriteConfigurationDialogState !== undefined);

            overwriteConfigurationDialogState.resolveDoOverwriteConfiguration(
                (() => {
                    switch (action) {
                        case "overwrite":
                            return true;
                        case "cancel":
                            return false;
                    }
                })()
            );

            setOverwriteConfigurationDialogState(undefined);
        }
    );

    useEffect(() => {
        if (restorablePackageConfig === undefined) {
            return;
        }

        const isBookmarkedNew =
            restorablePackageConfigFunctions.getIsRestorablePackageConfigInStore({
                restorablePackageConfigs,
                restorablePackageConfig
            });

        if (isBookmarked && !isBookmarkedNew) {
            setIsNoLongerBookmarkedDialogOpen(true);
        }

        setIsBookmarked(isBookmarkedNew);
    }, [restorablePackageConfigs, restorablePackageConfig]);

    const onRequestCancel = useConstCallback(() =>
        routes.catalogExplorer({ "catalogId": route.params.catalogId }).push()
    );

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        navigator.clipboard.writeText(window.location.href)
    );

    const onIsBookmarkedValueChange = useConstCallback((isBookmarked: boolean) => {
        assert(restorablePackageConfig !== undefined);

        restorablePackageConfigFunctions[
            isBookmarked ? "saveRestorablePackageConfig" : "deleteRestorablePackageConfig"
        ]({
            restorablePackageConfig,
            "getDoOverwriteConfiguration": async ({ friendlyName }) => {
                const dDoOverwriteConfiguration = new Deferred<boolean>();

                setOverwriteConfigurationDialogState({
                    friendlyName,
                    "resolveDoOverwriteConfiguration": dDoOverwriteConfiguration.resolve
                });

                return await dDoOverwriteConfiguration.pr;
            }
        });
    });

    const {
        domRect: { height: rootHeight }
    } = useDomRect({
        "ref": scrollableDivRef
    });

    const { classes, cx } = useStyles({
        rootHeight,
        isCommandBarEnabled
    });

    const { t } = useTranslation({ CatalogLauncher });

    const evtSensitiveConfigurationDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<SensitiveConfigurationDialogProps["evtOpen"]>>()
    );

    const evtAutoLaunchDisabledDialogOpen = useConst(() => Evt.create());

    const onSensitiveConfigurationDialogDialogClose = useConstCallback<
        SensitiveConfigurationDialogProps["onClose"]
    >(({ doProceedToLaunch }) => {
        if (!doProceedToLaunch) {
            return;
        }
        launcher.launch();
    });

    if (!isReady) {
        return null;
    }

    return (
        <>
            <div className={cx(classes.root, className)} ref={scrollableDivRef}>
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
                <div className={classes.wrapperForMawWidth}>
                    <CatalogLauncherMainCard
                        packageName={packageName}
                        packageIconUrl={icon}
                        isBookmarked={isBookmarked}
                        onIsBookmarkedValueChange={onIsBookmarkedValueChange}
                        friendlyName={friendlyName}
                        isShared={isShared}
                        onFriendlyNameChange={launcher.changeFriendlyName}
                        onIsSharedValueChange={launcher.changeIsShared}
                        onRequestLaunch={launcher.launch}
                        onRequestCancel={onRequestCancel}
                        onRequestRestoreAllDefault={
                            areAllFieldsDefault ? undefined : launcher.restoreAllDefault
                        }
                        onRequestCopyLaunchUrl={
                            areAllFieldsDefault ? undefined : onRequestCopyLaunchUrl
                        }
                        isLaunchable={isLaunchable}
                    />
                    {Object.keys(indexedFormFields).map(
                        dependencyNamePackageNameOrGlobal => (
                            <CatalogLauncherConfigurationCard
                                key={dependencyNamePackageNameOrGlobal}
                                dependencyNamePackageNameOrGlobal={
                                    dependencyNamePackageNameOrGlobal
                                }
                                {...indexedFormFields[dependencyNamePackageNameOrGlobal]}
                                onFormValueChange={launcher.changeFormFieldValue}
                                formFieldsIsWellFormed={formFieldsIsWellFormed}
                            />
                        )
                    )}
                </div>
            </div>
            <Dialog
                title={t("no longer bookmarked dialog title")}
                body={t("no longer bookmarked dialog body")}
                buttons={
                    <Button onClick={onNoLongerBookmarkedDialogClose} autoFocus>
                        {t("ok")}
                    </Button>
                }
                isOpen={isNoLongerBookmarkedDialogOpen}
                onClose={onNoLongerBookmarkedDialogClose}
            />
            <Dialog
                title={t("should overwrite configuration dialog title")}
                subtitle={t("should overwrite configuration dialog subtitle", {
                    "friendlyName": overwriteConfigurationDialogState?.friendlyName ?? ""
                })}
                body={t("should overwrite configuration dialog body")}
                buttons={
                    <>
                        <Button
                            onClick={onOverwriteConfigurationDialogClickFactory("cancel")}
                            autoFocus
                            variant="secondary"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={onOverwriteConfigurationDialogClickFactory(
                                "overwrite"
                            )}
                        >
                            {t("replace")}
                        </Button>
                    </>
                }
                isOpen={overwriteConfigurationDialogState !== undefined}
                onClose={onOverwriteConfigurationDialogClickFactory("cancel")}
            />
            <SensitiveConfigurationDialog
                evtOpen={evtSensitiveConfigurationDialogOpen}
                onClose={onSensitiveConfigurationDialogDialogClose}
            />
            <AutoLaunchDisabledDialog evtOpen={evtAutoLaunchDisabledDialogOpen} />
        </>
    );
});

CatalogLauncher.displayName = symToStr({ CatalogLauncher });

export const { i18n } = declareComponentKeys<
    | "no longer bookmarked dialog title"
    | "no longer bookmarked dialog body"
    | "ok"
    | "should overwrite configuration dialog title"
    | { K: "should overwrite configuration dialog subtitle"; P: { friendlyName: string } }
    | "should overwrite configuration dialog body"
    | "cancel"
    | "replace"
    | "proceed to launch"
    | "sensitive configuration dialog title"
    | "auto launch disabled dialog title"
    | {
          K: "auto launch disabled dialog body";
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
>()({ CatalogLauncher });

const useStyles = tss
    .withName({ CatalogLauncher })
    .withParams<{ rootHeight: number; isCommandBarEnabled: boolean }>()
    .create(({ theme, rootHeight, isCommandBarEnabled }) => ({
        "root": {
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

type SensitiveConfigurationDialogProps = {
    evtOpen: NonPostableEvt<{ sensitiveConfigurations: FormFieldValue[] }>;
    onClose: (params: { doProceedToLaunch: boolean }) => void;
};

const SensitiveConfigurationDialog = memo((props: SensitiveConfigurationDialogProps) => {
    const { evtOpen, onClose } = props;

    const { t } = useTranslation({ CatalogLauncher });

    const [sensitiveConfigurations, setSensitiveConfigurations] = useState<
        FormFieldValue[] | undefined
    >(undefined);

    const onCloseFactory = useCallbackFactory(([doProceedToLaunch]: [boolean]) => {
        setSensitiveConfigurations(undefined);
        onClose({ doProceedToLaunch });
    });

    useEvt(
        ctx =>
            evtOpen.attach(ctx, ({ sensitiveConfigurations }) =>
                setSensitiveConfigurations(sensitiveConfigurations)
            ),
        [evtOpen]
    );

    return (
        <Dialog
            isOpen={sensitiveConfigurations !== undefined}
            title={t("sensitive configuration dialog title")}
            body={
                <>
                    {sensitiveConfigurations === undefined
                        ? null
                        : sensitiveConfigurations.map(({ path, value }) => (
                              <Markdown key={path.join()}>{`**${path.join(
                                  "."
                              )}**: \`${value}\``}</Markdown>
                          ))}
                </>
            }
            buttons={
                <>
                    <Button onClick={onCloseFactory(false)} variant="secondary">
                        {t("cancel")}
                    </Button>
                    <Button onClick={onCloseFactory(true)}>
                        {t("proceed to launch")}
                    </Button>
                </>
            }
            onClose={onCloseFactory(false)}
        />
    );
});

type AutoLaunchDisabledDialogProps = {
    evtOpen: NonPostableEvt<void>;
};

const AutoLaunchDisabledDialog = memo((props: AutoLaunchDisabledDialogProps) => {
    const { evtOpen } = props;

    const { t } = useTranslation({ CatalogLauncher });

    const [isOpen, setIsOpen] = useState(false);

    const { css, theme } = useDefaultStyles();

    useEvt(ctx => evtOpen.attach(ctx, () => setIsOpen(true)), [evtOpen]);

    return (
        <Dialog
            isOpen={isOpen}
            title={t("auto launch disabled dialog title")}
            body={
                <Text
                    typo="body 2"
                    htmlComponent="div"
                    className={css({
                        "marginTop": theme.spacing(3)
                    })}
                >
                    {t("auto launch disabled dialog body")}
                </Text>
            }
            buttons={
                <>
                    <Button onClick={() => setIsOpen(false)}>{t("ok")}</Button>
                </>
            }
            onClose={() => setIsOpen(false)}
        />
    );
});
