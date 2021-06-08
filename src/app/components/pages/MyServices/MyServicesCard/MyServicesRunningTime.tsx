

import { memo } from "react";
import { createUseClassNames, Icon } from "app/theme";
import { Typography } from "onyxia-ui";
import { cx } from "tss-react";
import { useFromNow } from "app/i18n/useMoment";
import { useTranslation } from "app/i18n/useTranslations";

const { useClassNames } = createUseClassNames<{ isOvertime: boolean; }>()(
    (theme, { isOvertime }) => {

        const color = isOvertime ? theme.colors.useCases.alertSeverity.error.main : undefined;

        return {
            "root": {
                color,
                "display": "flex",
                "alignItems": "center"
            },
            "icon": {
                color
            }
        };
    }
);


export type Props = {
    className?: string;
} & ({
    isRunning: true;
    startTime: number;
    isOvertime: boolean;
} |{
    isRunning: false;
});

export const MyServicesRunningTime = memo(
    (props: Props) => {

        const { className } = props;

        const { classNames } = useClassNames({ "isOvertime": !props.isRunning ? false : props.isRunning });

        const { fromNowText } = useFromNow({ "dateTime": props.isRunning ? props.startTime : 0 });

        const { t } = useTranslation("MyServicesRunningTime");

        return (
            <Typography className={cx(classNames.root, className)}>
                <Icon id="accessTime" className={classNames.icon} /> &nbsp;
                {props.isRunning ? fromNowText : t("launching")}
            </Typography>
        );

    }
);

export declare namespace MyServicesRunningTime {

    export type I18nScheme = {
        'launching': undefined;
    };
}



