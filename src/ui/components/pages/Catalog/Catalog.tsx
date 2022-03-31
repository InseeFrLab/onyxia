import { useMemo, useRef, memo } from "react";
import { createGroup } from "type-route";
import { useTranslation } from "ui/i18n/useTranslations";
import { useLng } from "ui/i18n/useLng";
import { makeStyles, PageHeader } from "ui/theme";
import { routes } from "ui/routes";
import type { Route } from "type-route";
import { CatalogExplorer } from "./CatalogExplorer";
import { CatalogLauncher } from "./CatalogLauncher";
import Link from "@mui/material/Link";
import { useSelector, selectors } from "ui/coreApi";
import { elementsToSentence } from "ui/tools/elementsToSentence";
import type { CollapseParams } from "onyxia-ui/tools/CollapsibleWrapper_legacy";

Catalog.routeGroup = createGroup([routes.catalogExplorer, routes.catalogLauncher]);

type PageRoute = Route<typeof Catalog.routeGroup>;

Catalog.getDoRequireUserLoggedIn = (route: PageRoute) => {
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

export function Catalog(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Catalog });

    const { classes, cx, css } = useStyles();

    const { scrollableDivRef } = (function useClosure() {
        const explorerScrollableDivRef = useRef<HTMLDivElement>(null);
        const launcherScrollableDivRef = useRef<HTMLDivElement>(null);

        const scrollableDivRef = (() => {
            switch (route.name) {
                case "catalogExplorer":
                    return explorerScrollableDivRef;
                case "catalogLauncher":
                    return launcherScrollableDivRef;
            }
        })();

        return { scrollableDivRef };
    })();

    const titleCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": (() => {
                switch (route.name) {
                    case "catalogExplorer":
                        return 600;
                    case "catalogLauncher":
                        return 100;
                }
            })(),
            "scrollableElementRef": scrollableDivRef,
        }),
        [scrollableDivRef, route.name],
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": (() => {
                switch (route.name) {
                    case "catalogExplorer":
                        return 300;
                    case "catalogLauncher":
                        return 50;
                }
            })(),
            "scrollableElementRef": scrollableDivRef,
        }),
        [scrollableDivRef, route.name],
    );

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                classes={{
                    "title": css({ "paddingBottom": 3 }),
                }}
                mainIcon="catalog"
                title={t("header text1")}
                helpTitle={t("header text2")}
                helpContent={<HelpContent />}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <div className={classes.bodyWrapper}>
                {(() => {
                    switch (route.name) {
                        case "catalogExplorer":
                            return (
                                <CatalogExplorer
                                    route={route}
                                    scrollableDivRef={scrollableDivRef}
                                />
                            );
                        case "catalogLauncher":
                            return (
                                <CatalogLauncher
                                    route={route}
                                    scrollableDivRef={scrollableDivRef}
                                />
                            );
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

const useStyles = makeStyles({ "name": { Catalog } })({
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

const HelpContent = memo(() => {
    const sourcesUrls = useSelector(state => {
        const { catalogExplorer, launcher } = state;

        return launcher.stateDescription === "ready"
            ? ({
                  "type": "package",
                  "sources": launcher.sources,
                  "packageName": launcher.packageName,
              } as const)
            : catalogExplorer.stateDescription !== "ready"
            ? undefined
            : ({
                  "type": "catalog",
                  "locationUrl":
                      selectors.catalogExplorer.locationUrl(state).locationUrl!,
                  "catalogId": catalogExplorer.selectedCatalogId,
              } as const);
    });

    const { t } = useTranslation({ Catalog });

    const { lng } = useLng();

    return (
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
                                              "catalogId": sourcesUrls.catalogId,
                                          })}
                                      </Link>
                                      .
                                  </>
                              );
                          case "package":
                              return sourcesUrls.sources.length === 0 ? null : (
                                  <>
                                      {t("contribute to the package", {
                                          "packageName": sourcesUrls.packageName,
                                      })}
                                      {elementsToSentence({
                                          "elements": sourcesUrls.sources.map(source => (
                                              <Link
                                                  href={source}
                                                  target="_blank"
                                                  underline="hover"
                                              >
                                                  {t("here")}
                                              </Link>
                                          )),
                                          "language": lng,
                                      })}
                                  </>
                              );
                      }
                  })()}
        </>
    );
});
