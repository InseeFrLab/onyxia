import { useState, memo, useEffect } from "react";
import type { RefObject } from "react";
import { makeStyles } from "ui/theme";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { CatalogExplorerCard } from "./CatalogExplorerCard";
import { useTranslation } from "ui/i18n";
import { Button, Text } from "ui/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import Link from "@mui/material/Link";
import { ReactComponent as ServiceNotFoundSvg } from "ui/assets/svg/ServiceNotFound.svg";
import { SearchBar } from "onyxia-ui/SearchBar";
import type { SearchBarProps } from "onyxia-ui/SearchBar";
import type { UnpackEvt } from "evt";
import { breakpointsValues } from "onyxia-ui";
import type { LocalizedString } from "ui/i18n";
import { useResolveLocalizedString } from "ui/i18n";
import { Evt } from "evt";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    packages: {
        packageName: string;
        packageIconUrl?: string;
        packageDescription: string;
        packageHomeUrl?: string;
        catalogId: string;
    }[];
    search: string;
    onSearchChange: (search: string) => void;
    onRequestLaunch: (params: { packageName: string; catalogId: string }) => void;
    onRequestRevealPackagesNotShown: () => void;
    selectedCatalogId: string;
    catalogs: {
        id: string;
        name: LocalizedString;
    }[];
    onSelectedCatalogIdChange: (selectedCatalogId: string) => void;
    scrollableDivRef: RefObject<HTMLDivElement>;
    notShownPackageCount: number;
};

export const CatalogExplorerCards = memo((props: Props) => {
    const {
        className,
        packages,
        search,
        onSearchChange,
        onRequestLaunch,
        onRequestRevealPackagesNotShown,
        catalogs,
        selectedCatalogId,
        onSelectedCatalogIdChange,
        scrollableDivRef,
        notShownPackageCount
    } = props;

    const [searchBarElement, setSearchBarElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (searchBarElement === null) {
            return;
        }

        searchBarElement.click();
    }, [searchBarElement]);

    const onRequestLaunchFactory = useCallbackFactory(
        ([packageName, catalogId]: [string, string]) =>
            onRequestLaunch({ packageName, catalogId })
    );

    const onShowMoreClick = useConstCallback(() => onRequestRevealPackagesNotShown());

    const { t } = useTranslation({ CatalogExplorerCards });

    const { classes, cx } = useStyles({
        "filteredCardCount": packages.length
    });

    const [evtSearchBarAction] = useState(() =>
        Evt.create<UnpackEvt<SearchBarProps["evtAction"]>>()
    );

    const onGoBackClick = useConstCallback(() => evtSearchBarAction.post("CLEAR SEARCH"));

    const { resolveLocalizedString } = useResolveLocalizedString();

    const onSelectedCatalogIdChangeFactory = useCallbackFactory(([catalogId]: [string]) =>
        onSelectedCatalogIdChange(catalogId)
    );

    return (
        <div className={cx(classes.root, className)}>
            <SearchBar
                ref={setSearchBarElement}
                className={classes.searchBar}
                search={search}
                evtAction={evtSearchBarAction}
                onSearchChange={onSearchChange}
                placeholder={t("search")}
            />
            {catalogs.length > 1 && (
                <div className={classes.catalogSwitcher}>
                    {catalogs.map(({ id, name }) => (
                        <CustomButton
                            key={id}
                            isSelected={search !== "" ? false : id === selectedCatalogId}
                            text={resolveLocalizedString(name)}
                            onClick={onSelectedCatalogIdChangeFactory(id)}
                        />
                    ))}
                </div>
            )}
            <div ref={scrollableDivRef} className={classes.cardsWrapper}>
                {packages.length === 0 ? undefined : (
                    <Text typo="section heading" className={classes.contextTypo}>
                        {t(
                            search !== ""
                                ? "search results"
                                : notShownPackageCount === 0
                                ? "all services"
                                : "main services"
                        )}
                    </Text>
                )}
                <div className={classes.cards}>
                    {packages.length === 0 ? (
                        <NoMatches search={search} onGoBackClick={onGoBackClick} />
                    ) : (
                        packages.map(
                            ({
                                packageName,
                                packageIconUrl,
                                packageDescription,
                                packageHomeUrl,
                                catalogId
                            }) => (
                                <CatalogExplorerCard
                                    key={catalogId + "/" + packageName}
                                    packageIconUrl={packageIconUrl}
                                    packageName={packageName}
                                    packageDescription={packageDescription}
                                    onRequestLaunch={onRequestLaunchFactory(
                                        packageName,
                                        catalogId
                                    )}
                                    packageHomeUrl={packageHomeUrl}
                                />
                            )
                        )
                    )}
                    {notShownPackageCount !== 0 && (
                        <CardShowMore
                            leftToShowCount={notShownPackageCount}
                            onClick={onShowMoreClick}
                        />
                    )}
                </div>
                <div className={classes.bottomScrollSpace} />
            </div>
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "main services"
    | "all services"
    | "search results"
    | "show more"
    | "no service found"
    | { K: "no result found"; P: { forWhat: string } }
    | "check spelling"
    | "go back"
    | "search"
>()({ CatalogExplorerCards });

const { CardShowMore } = (() => {
    type Props = {
        onClick(): void;
        leftToShowCount: number;
    };

    const useStyles = makeStyles()(() => ({
        "root": {
            "display": "flex",
            "justifyContent": "center",
            "alignItems": "center"
        }
    }));

    const CardShowMore = memo((props: Props) => {
        const { leftToShowCount, onClick } = props;

        const { t } = useTranslation({ CatalogExplorerCards });

        const { classes } = useStyles();

        return (
            <div className={classes.root}>
                <Button onClick={onClick}>
                    {t("show more")}&nbsp;({leftToShowCount})
                </Button>
            </div>
        );
    });

    return { CardShowMore };
})();

const useStyles = makeStyles<{
    filteredCardCount: number;
}>({ "name": { CatalogExplorerCards } })((theme, { filteredCardCount }) => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "catalogSwitcher": {
        "display": "flex",
        "marginBottom": theme.spacing(2)
    },
    "searchBar": {
        "marginBottom": theme.spacing(4)
    },
    "contextTypo": {
        "marginBottom": theme.spacing(4)
    },
    "cardsWrapper": {
        "flex": 1,
        "overflow": "auto"
    },
    "cards": {
        ...(filteredCardCount === 0
            ? {}
            : {
                  "display": "grid",
                  "gridTemplateColumns": `repeat(${(() => {
                      if (theme.windowInnerWidth >= breakpointsValues.xl) {
                          return 4;
                      }
                      if (theme.windowInnerWidth >= breakpointsValues.lg) {
                          return 3;
                      }

                      return 2;
                  })()},1fr)`,
                  "gap": theme.spacing(4)
              })
    },
    "bottomScrollSpace": {
        "height": theme.spacing(3)
    }
}));

const { NoMatches } = (() => {
    type Props = {
        search: string;
        onGoBackClick(): void;
    };

    const useStyles = makeStyles()(theme => ({
        "root": {
            "display": "flex",
            "justifyContent": "center"
        },
        "innerDiv": {
            "textAlign": "center",
            "maxWidth": 500
        },
        "svg": {
            "fill": theme.colors.palette.dark.greyVariant2,
            "width": 100,
            "margin": 0
        },
        "h2": {
            ...theme.spacing.topBottom("margin", 4)
        },
        "typo": {
            "marginBottom": theme.spacing(1),
            "color": theme.colors.palette.light.greyVariant3
        },
        "link": {
            "cursor": "pointer"
        }
    }));

    const NoMatches = memo((props: Props) => {
        const { search, onGoBackClick } = props;

        const { classes } = useStyles();

        const { t } = useTranslation({ CatalogExplorerCards });

        return (
            <div className={classes.root}>
                <div className={classes.innerDiv}>
                    <ServiceNotFoundSvg className={classes.svg} />
                    <Text typo="page heading" className={classes.h2}>
                        {t("no service found")}
                    </Text>
                    <Text className={classes.typo} typo="body 1">
                        {t("no result found", { "forWhat": search })}
                    </Text>
                    <Text className={classes.typo} typo="body 1">
                        {t("check spelling")}
                    </Text>
                    <Link className={classes.link} onClick={onGoBackClick}>
                        {t("go back")}
                    </Link>
                </div>
            </div>
        );
    });

    return { NoMatches };
})();

const { CustomButton } = (() => {
    type CustomButtonProps = {
        className?: string;
        isSelected: boolean;
        onClick: () => void;
        text: string;
    };

    const CustomButton = memo((props: CustomButtonProps) => {
        const { onClick, className, isSelected } = props;

        const onMouseDown = useConstCallback(
            (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                e.preventDefault();
                if (e.button !== 0) {
                    return;
                }
                onClick();
            }
        );

        const { classes, cx } = useStyles();

        return (
            <div
                className={cx(classes.root, className)}
                color="secondary"
                onMouseDown={onMouseDown}
            >
                <Text
                    typo={isSelected ? "label 1" : "body 1"}
                    color={!isSelected ? "secondary" : undefined}
                >
                    {props.text}
                </Text>
            </div>
        );
    });

    const useStyles = makeStyles({ "name": { CustomButton } })(theme => ({
        "root": {
            "padding": theme.spacing({ "topBottom": 2, "rightLeft": 3 }),
            "display": "flex",
            "alignItems": "center",
            "cursor": "pointer"
        }
    }));

    return { CustomButton };
})();
