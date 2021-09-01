import { useEffect, useMemo, useState } from "react";
import { makeStyles, PageHeader } from "app/theme";

import { useTranslation } from "app/i18n/useTranslations";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import type { Props as MyServicesCardsProps } from "./MyServicesCards";
import { MyServicesSavedConfigs } from "./MyServicesSavedConfigs";
import type { Props as MyServicesSavedConfigsProps } from "./MyServicesSavedConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks/useConstCallback";
import { thunks, selectors } from "lib/setup";
import { useDispatch, useSelector } from "app/interfaceWithLib/hooks";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { routes } from "app/routes";
import { createGroup } from "type-route";
import type { Route } from "type-route";
import { useSplashScreen } from "onyxia-ui";
import { Dialog } from "onyxia-ui/Dialog";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { Button } from "app/theme";

MyServices.routeGroup = createGroup([routes.myServices]);

type PageRoute = Route<typeof MyServices.routeGroup>;

MyServices.requireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

const useStyles = makeStyles<{
    isSavedConfigsExtended: boolean;
}>()((theme, { isSavedConfigsExtended }) => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column",
    },
    "contextTypo": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "payload": {
        "overflow": "hidden",
        "flex": 1,
        "display": "flex",
        "& > *": {
            "height": "100%",
        },
    },
    ...(() => {
        const ratio = 0.65;

        return {
            "cards": {
                "flex": ratio,
                "marginRight": theme.spacing(5),
            },
            "savedConfigs": {
                "flex": isSavedConfigsExtended ? 1 : 1 - ratio,
                "paddingRight": "2%",
            },
        };
    })(),
}));

export function MyServices(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation("MyServices");

    const dispatch = useDispatch();
    const displayableConfigs = useSelector(
        selectors.restorablePackageConfig.displayableConfigsSelector,
    );

    const userServicePassword = useSelector(
        state => state.userConfigs.userServicePassword.value,
    );

    const { isRunningServicesFetching, runningServices } = useSelector(
        ({ runningService: state }) => ({
            "isRunningServicesFetching": state.isFetching,
            "runningServices": state.isFetched ? state.runningServices : [],
        }),
    );

    const { hideSplashScreen, showSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (isRunningServicesFetching) {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [isRunningServicesFetching]);

    const onButtonBarClick = useConstCallback((buttonId: ButtonId) => {
        switch (buttonId) {
            case "launch":
                routes.catalogExplorer().push();
                return;
            case "refresh":
                dispatch(thunks.runningService.initializeOrRefreshIfNotAlreadyFetching());
                return;
            case "password":
                copyToClipboard(userServicePassword);
                return;
            case "trash":
                setIsDialogOpen(true);
                return;
        }
    });

    useEffect(() => {
        dispatch(thunks.restorablePackageConfig.fetchIconsIfNotAlreadyDone());
        dispatch(thunks.runningService.initializeOrRefreshIfNotAlreadyFetching());
    }, []);

    const { isSavedConfigsExtended } = route.params;

    const { classes, cx } = useStyles({ isSavedConfigsExtended });

    const onRequestToggleIsShortVariant = useConstCallback(() =>
        routes
            .myServices({
                "isSavedConfigsExtended": !isSavedConfigsExtended,
            })
            .push(),
    );

    const onSavedConfigsCallback = useConstCallback<
        MyServicesSavedConfigsProps["callback"]
    >(({ linkHref, action }) => {
        switch (action) {
            case "copy link":
                copyToClipboard(window.location.origin + linkHref);
                return;
            case "delete":
                dispatch(
                    thunks.restorablePackageConfig.deleteRestorablePackageConfig({
                        "restorablePackageConfig": displayableConfigs.find(
                            ({ restorablePackageConfig }) =>
                                routes.catalogLauncher({
                                    ...restorablePackageConfig,
                                    "autoLaunch": true,
                                }).href === linkHref,
                        )!.restorablePackageConfig,
                    }),
                );
                return;
            case "edit":
                routes
                    .catalogLauncher({
                        ...displayableConfigs.find(
                            ({ restorablePackageConfig }) =>
                                routes.catalogLauncher({
                                    ...restorablePackageConfig,
                                    "autoLaunch": true,
                                }).href === linkHref,
                        )!.restorablePackageConfig,
                        "autoLaunch": false,
                    })
                    .push();
                return;
        }
    });

    const savedConfigs = useMemo(
        (): MyServicesSavedConfigsProps["savedConfigs"] =>
            displayableConfigs.map(
                ({ logoUrl, friendlyName, restorablePackageConfig }) => ({
                    logoUrl,
                    friendlyName,
                    "link": routes.catalogLauncher({
                        ...restorablePackageConfig,
                        "autoLaunch": true,
                    }).link,
                }),
            ),
        [displayableConfigs],
    );

    const cards = useMemo(
        (): MyServicesCardsProps["cards"] =>
            isRunningServicesFetching
                ? undefined
                : [...runningServices]
                      .sort((a, b) => b.startedAt - a.startedAt)
                      .map(
                          ({
                              id,
                              logoUrl,
                              friendlyName,
                              packageName,
                              urls,
                              startedAt,
                              monitoringUrl,
                              isStarting,
                              postInstallInstructions,
                          }) => ({
                              "serviceId": id,
                              "packageIconUrl": logoUrl,
                              friendlyName,
                              packageName,
                              "infoUrl": routes.myService({ "serviceId": id }).href,
                              "openUrl": urls[0],
                              monitoringUrl,
                              "startTime": isStarting ? undefined : startedAt,
                              "isOvertime": Date.now() - startedAt > 3600 * 1000 * 24,
                              postInstallInstructions,
                          }),
                      ),
        [runningServices, isRunningServicesFetching],
    );

    const catalogExplorerLink = useMemo(() => routes.catalogExplorer().link, []);

    const [serviceIdRequestedToBeDeleted, setServiceIdRequestedToBeDeleted] = useState<
        string | undefined
    >();

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onRequestDelete = useConstCallback<MyServicesCardsProps["onRequestDelete"]>(
        ({ serviceId }) => {
            setServiceIdRequestedToBeDeleted(serviceId);
            setIsDialogOpen(true);
        },
    );

    const onDialogCloseFactory = useCallbackFactory(([doDelete]: [boolean]) => {
        if (doDelete) {
            if (serviceIdRequestedToBeDeleted) {
                dispatch(
                    thunks.runningService.stopService({
                        "serviceId": serviceIdRequestedToBeDeleted,
                    }),
                );
            } else {
                runningServices.map(({ id }) =>
                    dispatch(thunks.runningService.stopService({ "serviceId": id })),
                );
            }
        }

        setIsDialogOpen(false);
    });

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="services"
                title={t("text1")}
                helpTitle={t("text2")}
                helpContent={t("text3")}
                helpIcon="sentimentSatisfied"
            />
            <MyServicesButtonBar onClick={onButtonBarClick} />
            <div className={classes.payload}>
                {!isSavedConfigsExtended && (
                    <MyServicesCards
                        className={classes.cards}
                        cards={cards}
                        onRequestDelete={onRequestDelete}
                        catalogExplorerLink={catalogExplorerLink}
                    />
                )}
                <MyServicesSavedConfigs
                    isShortVariant={!isSavedConfigsExtended}
                    savedConfigs={savedConfigs}
                    className={classes.savedConfigs}
                    callback={onSavedConfigsCallback}
                    onRequestToggleIsShortVariant={onRequestToggleIsShortVariant}
                />
            </div>
            <Dialog
                title={t("confirm terminate title")}
                subtitle={t("confirm terminate subtitle")}
                body={t("confirm terminate body")}
                isOpen={isDialogOpen}
                onClose={onDialogCloseFactory(false)}
                buttons={
                    <>
                        <Button onClick={onDialogCloseFactory(false)} variant="secondary">
                            {t("cancel")}
                        </Button>
                        <Button onClick={onDialogCloseFactory(true)}>
                            {t("confirm")}
                        </Button>
                    </>
                }
            />
        </div>
    );
}

export declare namespace MyServices {
    export type I18nScheme = {
        text1: undefined;
        text2: undefined;
        text3: undefined;
        "running services": undefined;
        "confirm terminate title": undefined;
        "confirm terminate subtitle": undefined;
        "confirm terminate body": undefined;
        cancel: undefined;
        confirm: undefined;
    };
}
