
import { useEffect, useMemo } from "react";
import { PageHeader } from "app/components/shared/PageHeader";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import type { Props as MyServicesCardsProps } from "./MyServicesCards";
import { MyServicesSavedConfigs } from "./MyServicesSavedConfigs";
import type { Props as MyServicesSavedConfigsProps } from "./MyServicesSavedConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks";
import { thunks, selectors } from "lib/setup";
import { useDispatch, useSelector } from "app/interfaceWithLib/hooks";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { routes } from "app/routes";
import { createGroup } from "type-route";
import type { Route } from "type-route";
import { showSplashScreen, hideSplashScreen } from "onyxia-ui";

MyServices.routeGroup = createGroup([routes.myServices]);

type PageRoute = Route<typeof MyServices.routeGroup>;

MyServices.requireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className: string;
};

const { useClassNames } = createUseClassNames<{
    isSavedConfigsExtended: boolean;
}>()(
    (theme, { isSavedConfigsExtended }) => ({
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "contextTypo": {
            "margin": theme.spacing(3, 0)
        },
        "payload": {
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
                    "flex": ratio
                },
                "savedConfigs": {
                    "flex": isSavedConfigsExtended ? 1 : (1 - ratio)
                }
            };

        })()


    })
);

export function MyServices(props: Props) {

    const { className, route } = props;

    const { t } = useTranslation("MyServices");

    const dispatch = useDispatch();
    const displayableConfigs = useSelector(
        selectors.restorablePackageConfig.displayableConfigsSelector
    );

    const userServicePassword = useSelector(
        state => state.userConfigs.userServicePassword.value
    );

    const { isRunningServicesFetching, runningServices } = useSelector(
        ({ runningService: state }) => ({
            "isRunningServicesFetching": state.isFetching,
            "runningServices": state.isFetched ? state.runningServices : []
        })
    );

    useEffect(
        () => {

            if (isRunningServicesFetching) {
                showSplashScreen({ "enableTransparency": true });
            } else {
                hideSplashScreen();
            }

        },
        [isRunningServicesFetching]
    );

    const onButtonBarClick = useConstCallback(
        (buttonId: ButtonId) => {
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
                    runningServices.map(({ id }) =>
                        dispatch(
                            thunks.runningService
                                .stopService({ "serviceId": id })
                        )
                    );
                    return;
            }
        }
    );


    useEffect(
        () => {
            dispatch(thunks.restorablePackageConfig.fetchIconsIfNotAlreadyDone());
            dispatch(thunks.runningService.initializeOrRefreshIfNotAlreadyFetching());
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { isSavedConfigsExtended } = route.params;

    const { classNames } = useClassNames({ isSavedConfigsExtended });

    const onRequestToggleIsShortVariant = useConstCallback(
        () => routes.myServices({
            "isSavedConfigsExtended": !isSavedConfigsExtended
        }).push()
    );

    const onSavedConfigsCallback = useConstCallback<MyServicesSavedConfigsProps["callback"]>(
        ({ restoreConfigurationUrl, action }) => {
            switch (action) {
                case "copy link":
                    copyToClipboard(restoreConfigurationUrl);
                    return;
                case "delete":
                    dispatch(
                        thunks.restorablePackageConfig.deleteRestorablePackageConfig({
                            "restorablePackageConfig":
                                displayableConfigs
                                    .find(({ restorablePackageConfig }) =>
                                        routes.catalogLauncher(restorablePackageConfig).href === restoreConfigurationUrl
                                    )!.restorablePackageConfig
                        })
                    );
                    return;
            }
        }
    );

    const savedConfigs = useMemo(
        (): MyServicesSavedConfigsProps["savedConfigs"] =>
            displayableConfigs.map(
                ({ logoUrl, friendlyName, restorablePackageConfig }) => ({
                    logoUrl,
                    friendlyName,
                    "restoreConfigurationUrl":
                        routes.catalogLauncher(restorablePackageConfig).href
                })
            ),
        [displayableConfigs]
    );

    const cards = useMemo(
        (): MyServicesCardsProps["cards"] =>
            runningServices.map(
                ({ id, logoUrl, friendlyName, packageName, urls, startedAt, monitoringUrl, isStarting }) => ({
                    "serviceId": id,
                    "packageIconUrl": logoUrl,
                    friendlyName,
                    packageName,
                    "infoUrl": routes.myService({ "serviceId": id }).href,
                    "openUrl": urls[0],
                    monitoringUrl,
                    "startTime": isStarting ? undefined : startedAt,
                    "isOvertime": Date.now() - startedAt > 3600 * 24
                })
            ),
        [runningServices]
    );

    const onRequestDelete = useConstCallback<MyServicesCardsProps["onRequestDelete"]>(
        ({ serviceId }) => dispatch(thunks.runningService.stopService({ serviceId }))
    );

    return (
        <div className={cx(classNames.root, className)}>
            <PageHeader
                icon="services"
                text1={t("text1")}
                text2={t("text2")}
                text3={t("text3")}
            />
            <MyServicesButtonBar
                onClick={onButtonBarClick}
            />
            <div className={classNames.payload}>
                {!isSavedConfigsExtended &&
                    <MyServicesCards
                        className={classNames.cards}
                        cards={cards}
                        onRequestDelete={onRequestDelete}
                    />}
                <MyServicesSavedConfigs
                    isShortVariant={!isSavedConfigsExtended}
                    savedConfigs={savedConfigs}
                    className={classNames.savedConfigs}
                    callback={onSavedConfigsCallback}
                    onRequestToggleIsShortVariant={onRequestToggleIsShortVariant}
                />
            </div>
        </div>
    );

}

export declare namespace MyServices {

    export type I18nScheme = {
        text1: undefined;
        text2: undefined;
        text3: undefined;
        'running services': undefined;
    };

}




