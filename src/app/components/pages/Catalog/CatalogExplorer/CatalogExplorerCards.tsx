
import { useEffect, useState, useMemo, memo } from "react";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useCallbackFactory } from "powerhooks";
import { CatalogExplorerCard } from "./CatalogExplorerCard";
import { useTranslation } from "app/i18n/useTranslations";
import { Button } from "app/theme";
import { useConstCallback } from "powerhooks";
import Link from "@material-ui/core/Link";
import { ReactComponent as ServiceNotFoundSvg } from "app/assets/svg/ServiceNotFound.svg";
import { Typography } from "onyxia-ui";
import { CatalogExplorerSearchBar } from "./CatalogExplorerSearchBar";
import type { Props as SearchBarProps } from "./CatalogExplorerSearchBar";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

export type Props<PackageName extends string = string> = {
    className?: string;
    packages: {
        packageName: PackageName;
        packageIconUrl?: string;
        packageDescription: string;
        packageHomeUrl?: string;
    }[];
    onRequestLaunch(packageName: PackageName): void;
};

const cardCountPerLine = 3;

const { useClassNames } = createUseClassNames<{ filteredCardCount: number; isRevealed: boolean; }>()(
    (theme, { filteredCardCount, isRevealed }) => ({
        "root": {
            //Or set by the parent,
            //it must be constrained or the scroll will not work
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
        },
        "contextTypo": {
            "margin": theme.spacing(3, 0)
        },
        "cards": {
            "flex": 1,
            "overflow": "auto",
            ...(filteredCardCount === 0 ? {} : {
                "display": "grid",
                "gridTemplateColumns": `repeat(${cardCountPerLine},1fr)`,
                "gridTemplateRows": `repeat(2,1fr)`,
                //"gridAutoRows": "1fr",
                "gap": theme.spacing(3),
                "marginBottom": isRevealed ? undefined : theme.spacing(2)
            }),
        },
        "noMatches": {
            "height": "100%"
        }
    })
);

export const CatalogExplorerCards = memo(
    <PackageName extends string = string>(props: Props<PackageName>) => {

        const { className, packages: cardsContent, onRequestLaunch } = props;

        const [search, setSearch] = useState("");

        const onRequestLaunchFactory = useCallbackFactory(
            ([packageName]: [PackageName]) =>
                onRequestLaunch(packageName)
        );

        let [isRevealed, setIsRevealed] = useState(false);

        const onShowMoreClick = useConstCallback(() => setIsRevealed(true));

        const { t } = useTranslation("CatalogExplorerCards");

        useEffect(
            () => {

                //NOTE: We use setTimeout only because of Safari
                const timer = setTimeout(
                    () => setIsRevealed(search !== ""),
                    0
                );

                return () => clearTimeout(timer);

            },
            [search]
        );

        const filteredCards = useMemo(
            () => cardsContent
                .slice(0, isRevealed ? cardsContent.length : 5)
                .filter(({
                    packageName,
                    packageDescription,
                }) =>
                    [
                        packageName,
                        packageDescription
                    ].map(
                        str => str.toLowerCase()
                            .includes(search.toLowerCase())
                    ).includes(true)
                ),
            [cardsContent, isRevealed, search]
        );

        const { classNames } = useClassNames({
            "filteredCardCount": filteredCards.length,
            isRevealed
        });

        const [evtSearchBarAction] = useState(() =>
            Evt.create<UnpackEvt<SearchBarProps["evtAction"]>>()
        );


        const onGoBackClick = useConstCallback(
            () => evtSearchBarAction.post("CLEAR SEARCH")
        );

        return (
            <div className={cx(classNames.root, className)}>
                <CatalogExplorerSearchBar
                    search={search}
                    evtAction={evtSearchBarAction}
                    onSearchChange={setSearch}
                />
                {filteredCards.length === 0 ? undefined :
                    <Typography
                        variant="h4"
                        className={classNames.contextTypo}
                    >
                        {t(
                            search !== "" ?
                                "search results" :
                                isRevealed ?
                                    "all services" :
                                    "main services"
                        )}
                    </Typography>
                }
                <div className={classNames.cards}>
                    {
                        filteredCards.length === 0 ?
                            <NoMatches
                                className={classNames.noMatches}
                                search={search}
                                onGoBackClick={onGoBackClick}
                            /> :
                            filteredCards
                                .map(
                                    ({
                                        packageName,
                                        packageIconUrl,
                                        packageDescription,
                                        packageHomeUrl
                                    }) =>
                                        <CatalogExplorerCard
                                            key={packageName}
                                            packageIconUrl={packageIconUrl}
                                            packageName={packageName}
                                            packageDescription={packageDescription}
                                            onRequestLaunch={onRequestLaunchFactory(packageName)}
                                            packageHomeUrl={packageHomeUrl}
                                        />
                                )
                    }
                    {!isRevealed && <CardShowMore
                        leftToShowCount={cardsContent.length - 5}
                        onClick={onShowMoreClick}
                    />}
                </div>
            </div>
        );
    }
);

export declare namespace CatalogExplorerCards {

    export type I18nScheme = {
        'main services': undefined;
        'all services': undefined;
        'search results': undefined;
        'show more': undefined;
        'no service found': undefined;
        'no result found': { forWhat: string; }
        'check spelling': undefined;
        'go back': undefined;
    };
}


const { CardShowMore } = (() => {

    type Props = {
        onClick(): void;
        leftToShowCount: number;
    };

    const { useClassNames } = createUseClassNames()(
        () => ({
            "root": {
                "display": "flex",
                "justifyContent": "center",
                "alignItems": "center"
            }
        })
    );

    const CardShowMore = memo((props: Props) => {

        const { leftToShowCount, onClick } = props;

        const { t } = useTranslation("CatalogExplorerCards");

        const { classNames } = useClassNames({});

        return (
            <div className={classNames.root}>
                <Button
                    onClick={onClick}
                >
                    {t("show more")}&nbsp;({leftToShowCount})
                </Button>
            </div>
        );

    });

    return { CardShowMore };


})();

const { NoMatches } = (() => {

    type Props = {
        className: string;
        search: string;
        onGoBackClick(): void;
    };

    const { useClassNames } = createUseClassNames()(
        theme => ({
            "root": {
                "display": "flex",
                "alignItems": "center",
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
                "margin": theme.spacing(4, 0)
            },
            "typo": {
                "marginBottom": theme.spacing(1),
                "color": theme.colors.palette.light.greyVariant3
            },
            "link": {
                "cursor": "pointer"
            }
        })
    );

    const NoMatches = memo(
        (props: Props) => {

            const { className, search, onGoBackClick } = props;

            const { classNames } = useClassNames({});

            const { t } = useTranslation("CatalogExplorerCards");

            return (
                <div className={cx(classNames.root, className)}>

                    <div className={classNames.innerDiv}>
                        <ServiceNotFoundSvg className={classNames.svg} />
                        <Typography
                            variant="h2"
                            className={classNames.h2}
                        >{t("no service found")}</Typography>
                        <Typography
                            className={classNames.typo}
                            variant="body1"
                        >{t("no result found", { "forWhat": search })}</Typography>
                        <Typography
                            className={classNames.typo}
                            variant="body1"
                        >{t("check spelling")}</Typography>
                        <Link
                            className={classNames.link}
                            onClick={onGoBackClick}>
                            {t("go back")}
                        </Link>
                    </div>

                </div>


            );

        }
    );

    return { NoMatches };

})();