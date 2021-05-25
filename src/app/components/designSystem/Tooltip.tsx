
import { memo } from "react";
import type { ReactNode, ReactElement } from "react";
import MuiTooltip from "@material-ui/core/Tooltip";
import { createUseClassNames } from "app/theme/useClassNames";
import { Typography } from "app/components/designSystem/Typography";

export type Props = {
    title: NonNullable<ReactNode>;
    children: ReactElement<any, any>;
    enterDelay?: number;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "color": theme.custom.colors.palette.whiteSnow.light
        }
    })
);

export const Tooltip = memo((props: Props) => {

    const { title, children, enterDelay } = props;

    const { classNames } = useClassNames({});

    return (
        <MuiTooltip
            title={
                <Typography
                    className={classNames.root}
                    variant="caption"
                >
                    {title}
                </Typography>
            }
            enterDelay={enterDelay}
        >
            {children}
        </MuiTooltip>
    );

});

