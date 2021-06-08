

import { memo } from "react";
import { createUseClassNames, Icon } from "app/theme";
import { Typography } from "onyxia-ui";
import { cx } from "tss-react";
import { useFromNow } from "app/i18n/useMoment";

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
    startTime: number;
    isOvertime: boolean;
};

export const MyServicesRunningTime = memo(
    (props: Props) => {

        const { className, startTime, isOvertime } = props;

        const { classNames } = useClassNames({ isOvertime });

        const { fromNowText } = useFromNow({ "dateTime": startTime });

        return (
            <Typography className={cx(classNames.root, className)}>
                <Icon id="accessTime" className={classNames.icon} /> &nbsp;
                {fromNowText}
            </Typography>
        );

    }
);


