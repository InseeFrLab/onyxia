
import { useEffect, useState, useMemo, memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useCallbackFactory } from "powerhooks";
import { CatalogCard } from "./CatalogCard";
import { useTranslation } from "app/i18n/useTranslations";
import { Button } from "app/components/designSystem/Button";
import { useConstCallback } from "powerhooks";
import Link from "@material-ui/core/Link";
import { ReactComponent as ServiceNotFoundSvg } from "app/assets/svg/ServiceNotFound.svg";
import { Typography } from "app/components/designSystem/Typography";

export type Params<ServiceTitle extends string> = {
    className?: string;
    cardsContent: {
        serviceTitle: ServiceTitle;
        serviceImageUrl?: string;
        serviceDescription: string;
        doDisplayLearnMore: boolean;
    }[];
    search: string;
    onRequestLaunch(serviceTitle: ServiceTitle): void;
    onRequestLearnMore(serviceTitle: ServiceTitle): void;
    onClearSearch(): void;
};

const cardCountPerLine = 3;

const { useClassNames } = createUseClassNames<{ filteredCardCount: number; }>()(
    (theme, { filteredCardCount }) => ({
        "root": {
            //Or set by the parent,
            //it must be constrained or the scroll will not work
            "height": "100%",
            "overflow": "auto",
            ...(filteredCardCount === 0 ? {} : {
                "display": "grid",
                "gridTemplateColumns": `repeat(${cardCountPerLine},1fr)`,
                "gridAutoRows": "1fr",
                "gap": theme.spacing(3),
            })
        },
        "noMatches": {
            "height": "100%"
        }
    })
);

export const CatalogCards = memo(
    <ServiceTitle extends string = string>(props: Params<ServiceTitle>) => {

        const { className, cardsContent, search, onClearSearch } = props;


        const onRequestActionFactory = useCallbackFactory(
            ([serviceTitle, action]: [ServiceTitle, "onRequestLaunch" | "onRequestLearnMore"]) =>
                props[action](serviceTitle)
        );

        const [isRevealed, setIsRevealed] = useState(false);

        const onShowMoreClick = useConstCallback(() => setIsRevealed(true));


        useEffect(
            () => setIsRevealed(search !== ""),
            [search]
        );

        const filteredCards = useMemo(
            () => cardsContent
                .slice(0, isRevealed ? cardsContent.length : 5)
                .filter(({
                    serviceTitle,
                    serviceDescription,
                }) =>
                    [
                        serviceTitle,
                        serviceDescription
                    ].map(
                        str => str.toLowerCase()
                            .includes(search.toLowerCase())
                    ).includes(true)
                ),
            [cardsContent, isRevealed, search]
        );

        const { classNames } = useClassNames({ 
            "filteredCardCount": filteredCards.length 
        });

        return (
            <div className={cx(classNames.root, className)}>
                {
                    filteredCards.length === 0 ?
                        <NoMatches
                            className={classNames.noMatches}
                            search={search}
                            onGoBackClick={onClearSearch}
                        /> :
                        filteredCards
                            .map(
                                ({
                                    serviceTitle,
                                    serviceImageUrl,
                                    serviceDescription,
                                    doDisplayLearnMore
                                }) =>
                                    <CatalogCard
                                        key={serviceTitle}
                                        serviceImageUrl={serviceImageUrl}
                                        serviceTitle={serviceTitle}
                                        serviceDescription={serviceDescription}
                                        onRequestLaunch={
                                            onRequestActionFactory(serviceTitle, "onRequestLaunch")
                                        }
                                        onRequestLearnMore={
                                            !doDisplayLearnMore ?
                                                undefined :
                                                onRequestActionFactory(serviceTitle, "onRequestLaunch")
                                        }
                                    />
                            )
                }
                {!isRevealed && <CardShowMore
                    leftToShowCount={cardsContent.length - 5}
                    onClick={onShowMoreClick}
                />}
            </div>
        );
    }
);

export declare namespace CatalogCards {

    export type I18nScheme = {
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

        const { t } = useTranslation("CatalogCards");

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
                "fill": theme.custom.colors.palette.midnightBlue.light3,
                "width": 100,
                "margin": 0
            },
            "h2": {
                "margin": theme.spacing(4, 0)
            },
            "typo": {
                "marginBottom": theme.spacing(1),
                "color": theme.custom.colors.palette.whiteSnow.greyVariant3
            }
        })
    );

    const NoMatches = memo(
        (props: Props) => {

            const { className, search, onGoBackClick } = props;

            const { classNames } = useClassNames({});

            const { t } = useTranslation("CatalogCards");

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
                        <Link onClick={onGoBackClick}>{t("go back")}</Link>
                    </div>

                </div>


            );

        }
    );

    return { NoMatches };

})();