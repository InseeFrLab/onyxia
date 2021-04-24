
import { useEffect, useState, memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useCallbackFactory } from "powerhooks";
import { CatalogCard } from "./CatalogCard";
import { useTranslation } from "app/i18n/useTranslations";
import { Button } from "app/components/designSystem/Button";
import { useConstCallback } from "powerhooks";

export type Params<ServiceTitle extends string> = {
    className?: string;
    cardsContent: {
        serviceTitle: ServiceTitle;
        serviceImageUrl?: string;
        serviceDescription: string;
        doDisplayLearnMore: boolean;
    }[];
    searchTerm: string;
    onRequestLaunch(serviceTitle: ServiceTitle): void;
    onRequestLearnMore(serviceTitle: ServiceTitle): void;
};

const cardCountPerLine = 3;

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            //Or set by the parent,
            //it must be constrained or the scroll will not work
            "height": "100%",
            "overflow": "auto",
            "display": "grid",
            "gridTemplateColumns": `repeat(${cardCountPerLine},1fr)`,
            "gridAutoRows": "1fr",
            "gap": theme.spacing(3),
        }
    })
);

export const CatalogCards = memo(
    <ServiceTitle extends string = string>(props: Params<ServiceTitle>) => {

        const { className, cardsContent, searchTerm } = props;

        const { classNames } = useClassNames({});

        const onRequestActionFactory = useCallbackFactory(
            ([serviceTitle, action]: [ServiceTitle, "onRequestLaunch" | "onRequestLearnMore"]) =>
                props[action](serviceTitle)
        );

        const [isRevealed, setIsRevealed] = useState(false);

        const onShowMoreClick = useConstCallback(() => setIsRevealed(true));

        useEffect(
            () => setIsRevealed(searchTerm !== ""),
            [searchTerm]
        );

        return (
            <div className={cx(classNames.root, className)}>
                {
                    cardsContent
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
                                    .includes(searchTerm.toLowerCase())
                            )
                                .includes(true)
                        )
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