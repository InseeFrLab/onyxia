import { memo } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { useFromNow } from "ui/shared/useFormattedDate";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
    startTime: number;
    doesHaveBeenRunningForTooLong: boolean;
};

export const MyServicesRunningTime = memo((props: Props) => {
    const { className, startTime, doesHaveBeenRunningForTooLong } = props;

    const { classes, cx } = useStyles({
        isOvertime: doesHaveBeenRunningForTooLong
    });

    const { fromNowText } = useFromNow({
        dateTime: startTime
    });

    return (
        <Text typo="label 1" className={cx(classes.root, className)}>
            <Icon icon={getIconUrlByName("AccessTime")} className={classes.icon} /> &nbsp;
            {fromNowText}
        </Text>
    );
});

const useStyles = tss
    .withName({ MyServicesRunningTime })
    .withParams<{ isOvertime: boolean }>()
    .create(({ theme, isOvertime }) => {
        const color = isOvertime
            ? theme.colors.useCases.alertSeverity.warning.main
            : undefined;

        return {
            root: {
                color,
                display: "flex",
                alignItems: "center"
            },
            icon: { color }
        };
    });
