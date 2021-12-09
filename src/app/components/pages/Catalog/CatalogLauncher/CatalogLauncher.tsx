/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, memo } from "react";
import type { RefObject } from "react";
import { makeStyles, Button } from "app/theme";
import { routes } from "app/routes/router";
import type { Route } from "type-route";
import { CatalogLauncherMainCard } from "./CatalogLauncherMainCard";
import { CatalogLauncherConfigurationCard } from "./CatalogLauncherConfigurationCard";
import { useSelector, selectors, pure, useThunks } from "app/libApi";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { assert } from "tsafe/assert";
import { useSplashScreen } from "onyxia-ui";
import { Dialog } from "onyxia-ui/Dialog";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Deferred } from "evt/tools/Deferred";

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
        copyToClipboard(window.location.href),
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
                            launcherThunks.launch();
                        }
                        hideSplashScreen();
                        break;
                    case "launching":
                        showSplashScreen({ "enableTransparency": true });
                        break;
                    case "launched":
                        hideSplashScreen();
                        routes.myServices().push();
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

    const { t } = useTranslation({ CatalogLauncher });

    if (state.stateDescription !== "ready") {
        return null;
    }

    assert(restorablePackageConfig !== undefined);
    assert(indexedFormFields !== undefined);
    assert(isLaunchable !== undefined);
    assert(friendlyName !== undefined);
    assert(isShared !== undefined);

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
        </>
    );
});

export declare namespace CatalogLauncher {
    export type I18nScheme = {
        "no longer bookmarked dialog title": undefined;
        "no longer bookmarked dialog body": undefined;
        "ok": undefined;
        "should overwrite configuration dialog title": undefined;
        "should overwrite configuration dialog subtitle": { friendlyName: string };
        "should overwrite configuration dialog body": undefined;
        "cancel": undefined;
        "replace": undefined;
    };
}

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
