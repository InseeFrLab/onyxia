
import { createGroup } from "type-route";
import { PageHeader } from "app/components/shared/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { routes } from "app/routes/router";
import type { Route } from "type-route";
import { CatalogExplorer } from "./CatalogExplorer/CatalogExplorer";
import { CatalogLauncher } from "./CatalogLauncher/CatalogLauncher";
import Link from "@material-ui/core/Link";
import { useSelector } from "app/interfaceWithLib/hooks";

Catalog.routeGroup = createGroup([
    routes.catalogExplorer,
    routes.catalogLauncher
]);

type PageRoute = Route<typeof Catalog.routeGroup>;

Catalog.requireUserLoggedIn = (route: PageRoute) => {
    switch (route.name) {
        case "catalogExplorer": return false;
        case "catalogLauncher": return true;
    }
};

export type Props = {
    route: PageRoute;
    className?: string;
};

const { useClassNames } = createUseClassNames<{}>()(
    () => ({
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "payload": {
            "overflow": "hidden",
            "flex": 1
        }
    })
);

export function Catalog(props: Props) {

    const { className, route } = props;

    const { t } = useTranslation("Catalog");

    const { classNames } = useClassNames({});

    const locationUrl = useSelector(
        ({ catalogExplorer })=> catalogExplorer.stateDescription !== "ready" ? 
            undefined : catalogExplorer.locationUrl
    );

    return (
        <div className={cx(classNames.root, className)}>
            <PageHeader
                icon="services"
                text1={t("header text1")}
                text2={t("header text2")}
                text3={<>
                    {t("all services are open sources")}
                    {
                        locationUrl === undefined ?
                            null :
                            <Link href={locationUrl} target="_blank"> {t("contribute to the catalog")} </Link>
                    }
                </>}
            />
            {(() => {
                switch (route.name) {
                    case "catalogExplorer":
                        return (
                            <CatalogExplorer
                                route={route}
                                className={classNames.payload}
                            />
                        );
                    case "catalogLauncher":
                        return (
                            <CatalogLauncher
                                route={route}
                                className={classNames.payload}
                            />
                        );
                }
            })()}
        </div>
    );

}
export declare namespace Catalog {

    export type I18nScheme = {
        'header text1': undefined;
        'header text2': undefined;
        'all services are open sources': undefined;
        'contribute to the catalog': undefined;
    };

}
