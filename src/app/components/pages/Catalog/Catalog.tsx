
import { useState, useEffect } from "react";
import { CatalogCards } from "./CatalogCards";
import type { Params as CatalogCardsParams } from "./CatalogCards";
import { createGroup } from "type-route";
import { routes } from "app/router";
import { PageHeader } from "app/components/shared/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useConstCallback } from "powerhooks";
import type { Route } from "type-route";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { useAppConstants } from "app/interfaceWithLib/hooks";
import { useAsync } from "react-async-hook";

const { useClassNames } = createUseClassNames<{}>()(
    theme => ({
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "cards": {
            "overflow": "hidden",
            "flex": 1,
            "marginBottom": theme.spacing(2)
        }
    })
);

Catalog.routeGroup = createGroup([routes.catalogNew]);

Catalog.requireUserLoggedIn = false;

export type Props = {
    className?: string;
    route: Route<typeof Catalog.routeGroup>;
};


export function Catalog(props: Props) {

    const { className, route } = props;

    const { t } = useTranslation("Catalog");

    const { classNames } = useClassNames({});

    const onRequestLaunch = useConstCallback<CatalogCardsParams["onRequestLaunch"]>(
        () => { }
    );

    const onRequestLearnMore = useConstCallback<CatalogCardsParams["onRequestLearnMore"]>(
        () => { }
    );

    const [cardsContent, setCardContent] = useState<CatalogCardsParams["cardsContent"] | undefined>(undefined);

    const { onyxiaApiClient } = useAppConstants();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const { result: catalogs } = useAsync(onyxiaApiClient.getCatalogs, []);

    const { hideSplashScreen, showSplashScreen } = useSplashScreen();

    useEffect(
        () => {

            if (cardsContent === undefined) {
                showSplashScreen({ "enableTransparency": true });
            } else {
                hideSplashScreen();
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cardsContent]
    );

    useEffect(
        () => {

            if (
                route.params.catalogId !== undefined ||
                catalogs === undefined
            ) {
                return;
            }

            routes.catalogNew({ "catalogId": catalogs[0].id }).replace();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.params.catalogId, catalogs ?? null]
    );

    useEffect(
        () => {

            if (
                route.params.catalogId === undefined ||
                catalogs === undefined
            ) {
                return;
            }

            setCardContent(
                catalogs[0].catalog.packages.map(({ icon, description, name }) => ({
                    "serviceImageUrl": icon,
                    "serviceTitle": name,
                    "serviceDescription": description,
                    "doDisplayLearnMore": false
                }))
                    .sort((a, b) =>
                        getHardCodedServiceWeight(b.serviceTitle) -
                        getHardCodedServiceWeight(a.serviceTitle)
                    )
            );

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.params.catalogId, catalogs ?? null]
    );

    if (cardsContent === undefined) {
        return null;
    }

    return (
        <div className={cx(classNames.root, className)}>
            <PageHeader
                icon="services"
                text1={t("header text1")}
                text2={t("header text2")}
                text3={t("header text3")}
            />
            <CatalogCards
                className={classNames.cards}
                cardsContent={cardsContent}
                onRequestLaunch={onRequestLaunch}
                onRequestLearnMore={onRequestLearnMore}
            />
        </div>
    );

}


export declare namespace Catalog {

    export type I18nScheme = {
        'header text1': undefined;
        'header text2': undefined;
        'header text3': undefined;
    };

}

const { getHardCodedServiceWeight } = (() => {

    const mainServices = ["rstudio", "jupyter", "ubuntu", "postgres", "code"];

    function getHardCodedServiceWeight(serviceTitle: string) {

        for (let i = 0; i < mainServices.length; i++) {

            if (serviceTitle.toLowerCase().includes(mainServices[i])) {
                return mainServices.length - i;
            }

        }

        return 0;

    }

    return { getHardCodedServiceWeight };

})();
