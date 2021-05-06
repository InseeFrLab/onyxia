
import { memo, useState, useEffect } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Params as CatalogCardsParams } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { useAppConstants } from "app/interfaceWithLib/hooks";
import { useAsync } from "react-async-hook";
import { routes } from "app/router";
import type { Route } from "type-route";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
};

export const CatalogExplorer = memo((props: Props) => {

    const { className, route } = props;

    const [cardsContent, setCardContent] = useState<CatalogCardsParams["cardsContent"] | undefined>(undefined);

    const onRequestLaunch = useConstCallback<CatalogCardsParams["onRequestLaunch"]>(
        serviceTitle =>
            routes.catalog({
                "optionalTrailingPath": `${route.params.catalogId}/${serviceTitle}/deploiement`
            }).push()
    );

    const onRequestLearnMore = useConstCallback<CatalogCardsParams["onRequestLearnMore"]>(
        () => {
            alert("todo");
        }
    );

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

            if (route.params.catalogId === undefined) {

                if (catalogs === undefined) {
                    return;
                }

                routes.catalogExplorer({ "catalogId": catalogs[0].id }).replace();

            }

            if (catalogs !== undefined && route.params.catalogId !== undefined) {

                setCardContent(
                    catalogs
                        .find(({ id }) => route.params.catalogId === id)!
                        .catalog
                        .packages
                        .map(({ icon, description, name }) => ({
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

            }

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.params.catalogId, catalogs ?? Object]
    );

    if (cardsContent === undefined) {
        return null;
    }

    return (
        <CatalogExplorerCards
            className={className}
            cardsContent={cardsContent}
            onRequestLaunch={onRequestLaunch}
            onRequestLearnMore={onRequestLearnMore}
        />
    );
});

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