
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
        serviceId: string;
        packageIconUrl?: string;
        friendlyName: string;
        packageName: string;
        infoUrl: string;
        openUrl: string;
        monitoringUrl: string | undefined;
        startTime: number | undefined;
        isOvertime: boolean;
    }[];
    onRequestDelete(params: { serviceId: string; }): void;
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
            ([serviceId]: [string]) => onRequestDelete({ serviceId })
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
                                key={card.openUrl}
                                {...card}
                                onRequestDelete={onRequestDeleteFactory(card.serviceId)}
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

