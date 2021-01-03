
import type React from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTooltip from "@material-ui/core/Tooltip";
import { TooltipClassKey } from "@material-ui/core/Tooltip";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
    children: React.ReactElement;
    title: NonNullable<React.ReactNode>;
};

const defaultProps: Optional<Props> = {
};

const useStyles = makeStyles(
    () => createStyles<Id<TooltipClassKey, "tooltip">, {}>({
        "tooltip": {
        }
    })
);

export function Tooltip(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { title, children } = completedProps;

    const classes = useStyles();

    return (
        <MuiTooltip
            title={title}
            classes={classes}
        >
            {children}
        </MuiTooltip>
    );

}
