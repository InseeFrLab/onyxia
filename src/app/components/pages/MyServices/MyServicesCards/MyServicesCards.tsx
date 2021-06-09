
import { memo } from "react";
import { MyServicesCard } from "./MyServicesCard";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";
import { Typography } from "onyxia-ui";
import { useCallbackFactory } from "powerhooks";

export type Props = {
    className?: string;
    cards: {
        packageIconUrl?: string;
        friendlyName: string;
        packageName: string;
        infoHref: string;
        //Used as id
        openHref: string;
        monitorHref: string;
        //Undefined when the service is not yey launched
        startTime: number | undefined;
        isOvertime: boolean;
    }[];
    onRequestDelete(params: { openHref: string }): void;
}

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "overflow": "hidden",
            "display": "flex",
            "flexDirection": "column"
        },
        "header": {
            "margin": theme.spacing(2, 0),
        },
        "wrapper": {
            "flex": 1,
            "overflow": "auto",
            "display": "grid",
            "gridTemplateColumns": `repeat(2,1fr)`,
            "gap": theme.spacing(3),
        }
    })
);

export const MyServicesCards = memo(
    (props: Props) => {

        const { className, onRequestDelete, cards } = props;

        const { classNames } = useClassNames({});

        const { t } = useTranslation("MyServicesCards");

        const onRequestDeleteFactory = useCallbackFactory(
            ([openHref]: [string]) => onRequestDelete({ openHref })
        );

        return (
            <div className={cx(classNames.root, className)}>
                <Typography variant="h4" className={classNames.header}>
                    {t("running services")}
                </Typography>
                <div className={classNames.wrapper}>

                    {
                        cards.map(card =>
                            <MyServicesCard
                                key={card.openHref}
                                {...card}
                                onRequestDelete={onRequestDeleteFactory(card.openHref)}
                            />
                        )
                    }

                </div>
            </div>
        )

    }
);

export declare namespace MyServicesCards {

    export type I18nScheme = {
        'running services': undefined;
    };

}

