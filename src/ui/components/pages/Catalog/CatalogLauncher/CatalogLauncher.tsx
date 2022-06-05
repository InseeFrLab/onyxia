/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, memo } from "react";
import type { RefObject } from "react";
import { makeStyles, Button } from "ui/theme";
import { routes } from "ui/routes";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import { CatalogLauncherConfigurationCard } from "./CatalogLauncherConfigurationCard";
import { useSelector, selectors, pure, useThunks } from "ui/coreApi";
import { useConstCallback } from "powerhooks/useConstCallback";
import * as clipboard from "clipboard-polyfill/text";
import { assert } from "tsafe/assert";
import { useSplashScreen } from "onyxia-ui";
import { Dialog } from "onyxia-ui/Dialog";
import { useTranslation } from "ui/i18n";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";
import type { NonPostableEvt } from "evt";
import type { FormFieldValue } from "core/usecases/sharedDataModel/FormFieldValue";
import { useEvt } from "evt/hooks/useEvt";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { Markdown } from "ui/tools/Markdown";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogLauncher>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogLauncher = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const { launcherThunks, restorablePackageConfigThunks } = useThunks();

    useEffect(() => {
        const { catalogId, packageName, formFieldsValueDifferentFromDefault } =
            route.params;

        launcherThunks.initialize({
            catalogId,
            packageName,
            formFieldsValueDifferentFromDefault,
        });

        return () => launcherThunks.reset();
    }, []);

    const { restorablePackageConfig } = useSelector(
        selectors.launcher.restorablePackageConfig,
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
                "autoLaunch": route.params.autoLaunch,
            })
            .replace();
    }, [restorablePackageConfig ?? Object]);

    const restorablePackageConfigs = useSelector(
        state => state.restorablePackageConfig.restorablePackageConfigs,
    );

    const [isBookmarked, setIsBookmarked] = useState(false);

    const [isNoLongerBookmarkedDialogOpen, setIsNoLongerBookmarkedDialogOpen] =
        useState(false);

    const onNoLongerBookmarkedDialogClose = useConstCallback(() =>
        setIsNoLongerBookmarkedDialogOpen(false),
    );

    const [overwriteConfigurationDialogState, setOverwriteConfigurationDialogState] =
        useState<
            | {
                  resolveDoOverwriteConfiguration: (
                      doOverwriteConfiguration: boolean,
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
                })(),
            );

            setOverwriteConfigurationDialogState(undefined);
        },
    );

    useEffect(() => {
        if (restorablePackageConfig === undefined) {
            return;
        }

        const isBookmarkedNew =
            pure.restorablePackageConfig.isRestorablePackageConfigInStore({
                restorablePackageConfigs,
                restorablePackageConfig,
            });

        if (isBookmarked && !isBookmarkedNew) {
            setIsNoLongerBookmarkedDialogOpen(true);
        }

        setIsBookmarked(isBookmarkedNew);
    }, [restorablePackageConfigs, restorablePackageConfig]);

    const { classes, cx } = useStyles();

    const onRequestCancel = useConstCallback(() =>
        routes.catalogExplorer({ "catalogId": route.params.catalogId }).push(),
    );

    const onRequestCopyLaunchUrl = useConstCallback(() =>
        clipboard.writeText(window.location.href),
    );

    const onIsBookmarkedValueChange = useConstCallback((isBookmarked: boolean) => {
        assert(restorablePackageConfig !== undefined);

        restorablePackageConfigThunks[
            isBookmarked ? "saveRestorablePackageConfig" : "deleteRestorablePackageConfig"
        ]({
            restorablePackageConfig,
            "getDoOverwriteConfiguration": async ({ friendlyName }) => {
                const dDoOverwriteConfiguration = new Deferred<boolean>();

                setOverwriteConfigurationDialogState({
                    friendlyName,
                    "resolveDoOverwriteConfiguration": dDoOverwriteConfiguration.resolve,
                });

                return await dDoOverwriteConfiguration.pr;
            },
        });
    });

    const { friendlyName } = useSelector(selectors.launcher.friendlyName);
    const { isShared } = useSelector(selectors.launcher.isShared);

    const state = useSelector(state => state.launcher);

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        switch (state.stateDescription) {
            case "not initialized":
                showSplashScreen({ "enableTransparency": true });
                break;
            case "ready":
                switch (state.launchState) {
                    case "not launching":
                        if (route.params.autoLaunch) {
                            const { sensitiveConfigurations } = state;

                            if (sensitiveConfigurations.length !== 0) {
                                evtSensitiveConfigurationDialogDialog.post({
                                    sensitiveConfigurations,
                                });
                            } else {
                                launcherThunks.launch();
                            }
                        }

                        hideSplashScreen();
                        break;
                    case "launching":
                        showSplashScreen({ "enableTransparency": true });
                        break;
                    case "launched":
                        hideSplashScreen();
                        routes
                            .myServices({ "autoLaunchServiceId": state.serviceId })
                            .push();
                        break;
                }
                break;
        }
    }, [
        state.stateDescription === "not initialized"
            ? state.stateDescription
            : state.launchState,
    ]);

    const { indexedFormFields } = useSelector(selectors.launcher.indexedFormFields);
    const { isLaunchable } = useSelector(selectors.launcher.isLaunchable);
    const { formFieldsIsWellFormed } = useSelector(
        selectors.launcher.formFieldsIsWellFormed,
    );

    const { t } = useTranslation({ CatalogLauncher });

    const evtSensitiveConfigurationDialogDialog = useConst(() =>
        Evt.create<UnpackEvt<SensitiveConfigurationDialogProps["evtOpen"]>>(),
    );

    const onSensitiveConfigurationDialogDialogClose = useConstCallback<
        SensitiveConfigurationDialogProps["onClose"]
    >(({ doProceedToLaunch }) => {
        if (!doProceedToLaunch) {
            return;
        }
        launcherThunks.launch();
    });

    if (state.stateDescription !== "ready") {
        return null;
    }

    assert(restorablePackageConfig !== undefined);
    assert(indexedFormFields !== undefined);
    assert(isLaunchable !== undefined);
    assert(friendlyName !== undefined);
    assert(isShared !== undefined);
    assert(formFieldsIsWellFormed !== undefined);

    return (
        <>
            <div
                className={cx(classes.wrapperForScroll, className)}
                ref={scrollableDivRef}
            >
                <div className={classes.wrapperForMawWidth}>
                    <CatalogLauncherMainCard
                        packageName={state.packageName}
                        packageIconUrl={state.icon}
                        isBookmarked={isBookmarked}
                        onIsBookmarkedValueChange={onIsBookmarkedValueChange}
                        friendlyName={friendlyName}
                        isShared={isShared}
                        onFriendlyNameChange={launcherThunks.changeFriendlyName}
                        onIsSharedValueChange={launcherThunks.changeIsShared}
                        onRequestLaunch={launcherThunks.launch}
                        onRequestCancel={onRequestCancel}
                        onRequestCopyLaunchUrl={
                            restorablePackageConfig.formFieldsValueDifferentFromDefault
                                .length !== 0
                                ? onRequestCopyLaunchUrl
                                : undefined
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
                                onFormValueChange={launcherThunks.changeFormFieldValue}
                                formFieldsIsWellFormed={formFieldsIsWellFormed}
                            />
                        ),
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
                    "friendlyName": overwriteConfigurationDialogState?.friendlyName ?? "",
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
                                "overwrite",
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
                evtOpen={evtSensitiveConfigurationDialogDialog}
                onClose={onSensitiveConfigurationDialogDialogClose}
            />
        </>
    );
});

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
>()({ CatalogLauncher });

const useStyles = makeStyles({ "name": { CatalogLauncher } })(theme => ({
    "wrapperForScroll": {
        "height": "100%",
        "overflow": "auto",
    },
    "wrapperForMawWidth": {
        "maxWidth": 1200,
        "& > *": {
            "marginBottom": theme.spacing(3),
        },
    },
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
                setSensitiveConfigurations(sensitiveConfigurations),
            ),
        [evtOpen],
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
                              <Markdown key={path.join()}>
                                  {`**${path.join(".")}**: \`${value}\``}
                              </Markdown>
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
