import { useEffect, useState } from "react";
import { useTranslation, useResolveLocalizedString } from "ui/i18n";
import { PageHeader } from "onyxia-ui/PageHeader";
import { tss } from "tss";
import { useCoreState, getCoreSync } from "core";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { routes, useRoute } from "ui/routes";
import { routeGroup } from "./route";
import { breakpointsValues } from "onyxia-ui";
import { Text } from "onyxia-ui/Text";
import { useEvt } from "evt/hooks";
import { SearchBar, type SearchBarProps } from "onyxia-ui/SearchBar";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { CatalogSwitcherButton } from "./CatalogSwitcherButton";
import { CatalogNoSearchMatches } from "./CatalogNoSearchMatches";
import { assert } from "tsafe/assert";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { CatalogChartCard } from "./CatalogChartCard";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { customIcons, getIconUrlByName } from "lazy-icons";

const Page = Catalog;
export default Page;

function Catalog() {
    const route = useRoute();
    assert(routeGroup.has(route));

    const { t } = useTranslation({ Catalog });

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const { isReady, selectedCatalog, availableCatalogs, filteredCharts } = useCoreState(
        "catalog",
        "main"
    );

    const {
        evts: { evtCatalog },
        functions: { catalog }
    } = getCoreSync();

    useEvt(
        ctx =>
            evtCatalog.$attach(
                action =>
                    action.actionName !== "catalogIdInternallySet" ? null : [action],
                ctx,
                ({ catalogId }) => routes.catalog({ catalogId }).replace()
            ),
        [evtCatalog]
    );

    useEffect(() => {
        catalog.changeSelectedCatalogId({ catalogId: route.params.catalogId });
    }, [route.params.catalogId]);

    useEffect(() => {
        catalog.setSearch({ search: route.params.search });
    }, [route.params.search]);

    const onRequestLaunchFactory = useCallbackFactory(
        ([catalogId, chartName]: [string, string]) => {
            routes
                .launcher({
                    catalogId,
                    chartName
                })
                .push();
        }
    );

    const { classes, css, theme } = useStyles({
        filteredCardCount: filteredCharts?.length ?? 0
    });

    const [searchBarElement, setSearchBarElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (searchBarElement === null) {
            return;
        }

        searchBarElement.click();
    }, [searchBarElement]);

    const [evtSearchBarAction] = useState(() =>
        Evt.create<UnpackEvt<SearchBarProps["evtAction"]>>()
    );

    const { resolveLocalizedString } = useResolveLocalizedString({
        labelWhenMismatchingLanguage: true
    });

    if (!isReady) {
        return null;
    }

    return (
        <div className={classes.root}>
            <PageHeader
                classes={{
                    root: css({ marginBottom: 0, marginLeft: theme.spacing(1) }),
                    title: css({ paddingBottom: 3 }),
                    helpTitle: css({ display: "none" }),
                    helpIcon: css({ display: "none" })
                }}
                mainIcon={customIcons.catalogSvgUrl}
                title={t("header")}
                helpTitle={""}
                helpContent={
                    selectedCatalog.description === undefined ? (
                        ""
                    ) : (
                        <LocalizedMarkdown
                            className={css({
                                "&>p": { margin: 0 }
                            })}
                        >
                            {selectedCatalog.description}
                        </LocalizedMarkdown>
                    )
                }
                helpIcon={getIconUrlByName("SentimentSatisfied")}
                titleCollapseParams={{
                    behavior: "collapses on scroll",
                    scrollTopThreshold: 650,
                    scrollableElementRef: scrollableDivRef
                }}
                helpCollapseParams={
                    selectedCatalog.description === undefined
                        ? {
                              behavior: "controlled",
                              isCollapsed: true
                          }
                        : {
                              behavior: "collapses on scroll",
                              scrollTopThreshold: 300,
                              scrollableElementRef: scrollableDivRef
                          }
                }
            />
            <div className={classes.bodyWrapper}>
                <div className={classes.body}>
                    <SearchBar
                        ref={setSearchBarElement}
                        className={classes.searchBar}
                        search={route.params.search}
                        evtAction={evtSearchBarAction}
                        onSearchChange={search => {
                            const { catalogId } = route.params;

                            assert(catalogId !== undefined);

                            routes
                                .catalog({ catalogId, search: search || undefined })
                                .replace();
                        }}
                        placeholder={t("search")}
                    />
                    {availableCatalogs.length > 1 && route.params.search === "" && (
                        <div className={classes.catalogSwitcher}>
                            {availableCatalogs.map(({ catalogId, catalogName }) => (
                                <CatalogSwitcherButton
                                    key={catalogId}
                                    isSelected={catalogId === selectedCatalog.id}
                                    text={
                                        catalogId === "all"
                                            ? t("title all catalog")
                                            : resolveLocalizedString(catalogName)
                                    }
                                    onClick={() =>
                                        routes.catalog({ catalogId }).replace()
                                    }
                                />
                            ))}
                        </div>
                    )}
                    <div ref={scrollableDivRef} className={classes.cardsWrapper}>
                        {filteredCharts.length !== 0 && route.params.search !== "" && (
                            <Text
                                typo="section heading"
                                className={classes.searchResults}
                            >
                                {t("search results")}
                            </Text>
                        )}
                        <div className={classes.cards}>
                            {filteredCharts.length === 0 ? (
                                <CatalogNoSearchMatches
                                    search={route.params.search}
                                    onGoBackClick={() =>
                                        evtSearchBarAction.post("CLEAR SEARCH")
                                    }
                                />
                            ) : (
                                filteredCharts.map(
                                    ({
                                        catalogId,
                                        chartName,
                                        chartNameWithHighlights,
                                        chartDescriptionWithHighlights,
                                        projectHomepageUrl,
                                        iconUrl
                                    }) => (
                                        <CatalogChartCard
                                            key={`${catalogId}${chartName}`}
                                            chartNameWithHighlights={
                                                chartNameWithHighlights
                                            }
                                            chartDescriptionWithHighlights={
                                                chartDescriptionWithHighlights
                                            }
                                            projectHomepageUrl={projectHomepageUrl}
                                            iconUrl={iconUrl}
                                            onRequestLaunch={onRequestLaunchFactory(
                                                catalogId,
                                                chartName
                                            )}
                                        />
                                    )
                                )
                            )}
                        </div>
                        <div className={classes.bottomScrollSpace} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "header"
    | "search results"
    | { K: "no result found"; P: { forWhat: string } }
    | "search"
    | "title all catalog"
>()({ Catalog });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ Catalog })
    .withParams<{ filteredCardCount: number }>()
    .create(({ theme, filteredCardCount }) => ({
        root: {
            height: "100%",
            display: "flex",
            flexDirection: "column"
        },
        bodyWrapper: {
            flex: 1,
            overflow: "hidden",
            paddingTop: theme.spacing(3)
        },
        body: {
            height: "100%",
            display: "flex",
            flexDirection: "column"
        },
        catalogSwitcher: {
            display: "flex"
        },
        searchBar: {
            marginBottom: theme.spacing(3),
            marginLeft: theme.spacing(2)
        },
        searchResults: {
            marginBottom: theme.spacing(3)
        },
        cardsWrapper: {
            flex: 1,
            overflow: "auto",
            paddingTop: theme.spacing(3),
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(3),
            borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
        },
        cards: {
            ...(filteredCardCount === 0
                ? {}
                : {
                      display: "grid",
                      gridTemplateColumns: `repeat(${(() => {
                          if (theme.windowInnerWidth >= breakpointsValues.xl) {
                              return 4;
                          }
                          if (theme.windowInnerWidth >= breakpointsValues.lg) {
                              return 3;
                          }

                          return 2;
                      })()},1fr)`,
                      gap: theme.spacing(4)
                  })
        },
        bottomScrollSpace: {
            height: theme.spacing(3)
        }
    }));
