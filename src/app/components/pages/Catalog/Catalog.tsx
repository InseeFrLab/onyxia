import { createGroup } from "type-route";
import { useTranslation } from "app/i18n/useTranslations";
import { useLng } from "app/i18n/useLng";
import { makeStyles, PageHeader } from "app/theme";

import { routes } from "app/routes/router";
import type { Route } from "type-route";
import { CatalogExplorer } from "./CatalogExplorer";
import { CatalogLauncher } from "./CatalogLauncher";
import Link from "@material-ui/core/Link";
import { useSelector } from "app/interfaceWithLib/hooks";
import { elementsToSentence } from "app/tools/elementsToSentence";
import { useState } from "react";

Catalog.routeGroup = createGroup([routes.catalogExplorer, routes.catalogLauncher]);

type PageRoute = Route<typeof Catalog.routeGroup>;

Catalog.requireUserLoggedIn = (route: PageRoute) => {
    switch (route.name) {
        case "catalogExplorer":
            return false;
        case "catalogLauncher":
            return true;
    }
};

export type Props = {
    route: PageRoute;
    className?: string;
};

const useStyles = makeStyles()({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column",
    },
    "bodyWrapper": {
        "flex": 1,
        "overflow": "hidden",
    },
});

export function Catalog(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation("Catalog");

    const { classes, cx } = useStyles();

    const sourcesUrls = useSelector(({ catalogExplorer, launcher }) =>
        launcher.stateDescription === "ready"
            ? ({
                  "type": "package",
                  "sources": launcher.sources,
                  "packageName": launcher.packageName,
              } as const)
            : catalogExplorer.stateDescription !== "ready"
            ? undefined
            : ({
                  "type": "catalog",
                  "locationUrl": catalogExplorer.locationUrl,
                  "catalogId": catalogExplorer.selectedCatalogId,
              } as const),
    );

    const { lng } = useLng();

    const [isPageHeaderTitleVisible, setIsPageHeaderTitleVisible] = useState(true);
    const [isPageHeaderHelperVisible, setIsPageHeaderHelperVisible] = useState(true);

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="catalog"
                title={t("header text1")}
                helpTitle={t("header text2")}
                helpContent={
                    <>
                        {t("all services are open sources")}
                        {sourcesUrls === undefined
                            ? null
                            : (() => {
                                  switch (sourcesUrls.type) {
                                      case "catalog":
                                          return (
                                              <>
                                                  <Link
                                                      href={sourcesUrls.locationUrl}
                                                      target="_blank"
                                                      underline="hover"
                                                  >
                                                      {t("contribute to the catalog", {
                                                          "catalogId":
                                                              sourcesUrls.catalogId,
                                                      })}
                                                  </Link>
                                                  .
                                              </>
                                          );
                                      case "package":
                                          return sourcesUrls.sources.length ===
                                              0 ? null : (
                                              <>
                                                  {t("contribute to the package", {
                                                      "packageName":
                                                          sourcesUrls.packageName,
                                                  })}
                                                  {elementsToSentence({
                                                      "elements": sourcesUrls.sources.map(
                                                          source => (
                                                              <Link
                                                                  href={source}
                                                                  target="_blank"
                                                                  underline="hover"
                                                              >
                                                                  {t("here")}
                                                              </Link>
                                                          ),
                                                      ),
                                                      "language": lng,
                                                  })}
                                              </>
                                          );
                                  }
                              })()}
                    </>
                }
                helpIcon="sentimentSatisfied"
                isTitleVisible={isPageHeaderTitleVisible}
                isHelpVisible={isPageHeaderHelperVisible}
            />
            <div className={classes.bodyWrapper}>
                {(() => {
                    switch (route.name) {
                        case "catalogExplorer":
                            return (
                                <CatalogExplorer
                                    route={route}
                                    onIsPageHeaderTitleVisibleValueChange={
                                        setIsPageHeaderTitleVisible
                                    }
                                    onIsPageHeaderHelpVisibleValueChange={
                                        setIsPageHeaderHelperVisible
                                    }
                                />
                            );
                        case "catalogLauncher":
                            return <CatalogLauncher route={route} />;
                    }
                })()}
            </div>
        </div>
    );
}
export declare namespace Catalog {
    export type I18nScheme = {
        "header text1": undefined;
        "header text2": undefined;
        "all services are open sources": undefined;
        "contribute to the catalog": { catalogId: string };
        "contribute to the package": { packageName: string };
        "here": undefined;
    };
}
