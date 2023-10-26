import { memo } from "react";
import { tss, Icon, Text } from "ui/theme";
import { useFromNow } from "ui/shared/useMoment";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
} & (
    | {
          isRunning: true;
          startTime: number;
          doesHaveBeenRunningForTooLong: boolean;
      }
    | {
          isRunning: false;
      }
);

export const MyServicesRunningTime = memo((props: Props) => {
    const { className } = props;

    const { classes, cx } = useStyles({
        "isOvertime": !props.isRunning ? false : props.doesHaveBeenRunningForTooLong
    });

    const { fromNowText } = useFromNow({
        "dateTime": props.isRunning ? props.startTime : 0
    });

    const { t } = useTranslation({ MyServicesRunningTime });

    return (
        <Text typo="label 1" className={cx(classes.root, className)}>
            <Icon iconId="accessTime" className={classes.icon} /> &nbsp;
            {props.isRunning ? fromNowText : t("launching")}
        </Text>
    );
});

export const { i18n } = declareComponentKeys<"launching">()({ MyServicesRunningTime });

const useStyles = tss
    .withName({ MyServicesRunningTime })
    .withParams<{ isOvertime: boolean }>()
    .create(({ theme, isOvertime }) => {
        const color = isOvertime
            ? theme.colors.useCases.alertSeverity.warning.main
            : undefined;

        return {
            "root": {
                color,
                "display": "flex",
                "alignItems": "center"
            },
            "icon": { color }
        };
    });
