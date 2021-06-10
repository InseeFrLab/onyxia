
import { useState, useEffect, memo } from "react";
import { PageHeader } from "app/components/shared/PageHeader";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
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

MyServices.routeGroup = createGroup([
    routes.catalogExplorer,
    routes.catalogLauncher
]);

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

    const { className } = props;

    const { t } = useTranslation("MyServices");

    const dispatch = useDispatch();
    const displayableConfigs = useSelector(
        selectors.restorablePackageConfig.displayableConfigsSelector
    );

    const onButtonBarClick = useConstCallback(
        (buttonId: ButtonId) => {

            //TODO

        }
    );

    const [isSavedConfigsExtended, setIsSavedConfigsExtended] = useState(false);

    useEffect(
        () => { dispatch(thunks.restorablePackageConfig.fetchIconsIfNotAlreadyDone()); },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { classNames } = useClassNames({ isSavedConfigsExtended });

    const onRequestToggleIsShortVariant = useConstCallback(
        () => setIsSavedConfigsExtended(!isSavedConfigsExtended)
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
                    />}
                <MyServicesSavedConfigs
                    isShortVariant={!isSavedConfigsExtended}
                    savedConfigs={
                        displayableConfigs.map(
                            ({ logoUrl, friendlyName, restorablePackageConfig }) => ({
                                logoUrl,
                                friendlyName,
                                "restoreConfigurationUrl":
                                    routes.catalogLauncher(restorablePackageConfig).href
                            })
                        )
                    }
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




