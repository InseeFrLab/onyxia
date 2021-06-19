
import { createGroup } from "type-route";
import { PageHeader } from "app/components/shared/PageHeader";
import { useTranslation } from "app/i18n/useTranslations";
import { useLng } from "app/i18n/useLng";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { routes } from "app/routes/router";
import type { Route } from "type-route";
import { CatalogExplorer } from "./CatalogExplorer";
import { CatalogLauncher } from "./CatalogLauncher";
import Link from "@material-ui/core/Link";
import { useSelector } from "app/interfaceWithLib/hooks";
import { elementsToSentence } from "app/tools/elementsToSentence";

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

    const sourcesUrls = useSelector(
        ({ catalogExplorer, launcher }) =>
            launcher.stateDescription === "ready" ?
                {
                    "type": "package",
                    "sources": launcher.sources,
                    "packageName": launcher.packageName
                } as const :
                catalogExplorer.stateDescription !== "ready" ?
                    undefined :
                    {
                        "type": "catalog",
                        "locationUrl": catalogExplorer.locationUrl,
                        "catalogId": catalogExplorer.selectedCatalogId
                    } as const
    );

    const { lng } = useLng();

    return (
        <div className={cx(classNames.root, className)}>
            <PageHeader
                icon="catalog"
                text1={t("header text1")}
                text2={t("header text2")}
                text3={<>
                    {t("all services are open sources")}
                    {
                        sourcesUrls === undefined ?
                            null :
                            (() => {
                                switch (sourcesUrls.type) {
                                    case "catalog":
                                        return (
                                            <>
                                                <Link
                                                    href={sourcesUrls.locationUrl}
                                                    target="_blank"
                                                >
                                                    {t("contribute to the catalog", { "catalogId": sourcesUrls.catalogId })}
                                                </Link>
                                            .
                                            </>
                                        );
                                    case "package":
                                        return (
                                            <>
                                                {t("contribute to the package", { "packageName": sourcesUrls.packageName })}
                                                {elementsToSentence({
                                                    "elements": sourcesUrls.sources.map(source =>
                                                        <Link
                                                            href={source}
                                                            target="_blank"
                                                        >
                                                            {t("here")}
                                                        </Link>
                                                    ),
                                                    "language": lng
                                                })}
                                            .
                                            </>
                                        );
                                }
                            })()
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
        'contribute to the catalog': { catalogId: string; };
        'contribute to the package': { packageName: string; };
        'here': undefined;
    };

}
