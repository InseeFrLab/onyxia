

import { memo } from "react";
import { createUseClassNames } from "app/theme";
import { Typography } from "onyxia-ui";
import { Button } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";
import { capitalize } from "app/tools/capitalize";
import { MyServicesBadge } from "./MyServicesBadge";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.shadows[1],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.shadows[6]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "boxSizing": "border-box"
        },
        "title": {
            "marginTop": theme.spacing(2)
        },
        "belowDivider": {
            "padding": theme.spacing(3),
            "paddingTop": theme.spacing(2),
            "flex": 1,
        }
    })
);

export type Props = {
    className?: string;
    packageIconUrl?: string;
    friendlyName: string;
    packageName: string;
    infoHref: string;
    onRequestDelete(): void;
    monitorHref: string;
    //Undefined when the service is not yey launched
    startTime: number | undefined;
    isOvertime: boolean;
};

export const MyServicesCard = memo((props: Props) => {

    const {
        className,
        packageIconUrl,
        friendlyName,
        packageName,
        infoHref,
        onRequestDelete,
        monitorHref,
        startTime, 
        isOvertime
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("MyServicesCard");

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                {packageIconUrl !== undefined &&
                    <MyServicesBadge 
                    src={packageIconUrl}
                    circleColor={isOvertime ? "red" : startTime === undefined ? "grey" : "green"}
                    />}
                <Typography
                    className={classNames.title}
                    variant="h5"
                >
                    {capitalize(friendlyName)}
                </Typography>

            </div>
            <div className={classNames.belowDivider}>

            </div>
        </div>
    );

});

export declare namespace MyServicesCard {

    export type I18nScheme = {
        service: undefined;
        'running for': undefined;
    };
}
