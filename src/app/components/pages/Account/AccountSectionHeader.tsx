import { memo } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "onyxia-ui/Tooltip";
import { Icon, Text } from "app/theme";
import { makeStyles } from "app/theme";
import { cx } from "tss-react";

export type Props = {
    className?: string;
    title: string;
    helperText?: ReactNode;
    tooltipText?: string;
};

const useStyles = makeStyles()(theme => ({
    "root": {
        "marginBottom": theme.spacing(4),
    },
    "title": {
        "display": "inline-block",
    },
    "helperText": {
        "marginTop": theme.spacing(2),
    },
    "helpIcon": {
        "marginLeft": theme.spacing(2),
    },
}));

export const AccountSectionHeader = memo((props: Props) => {
    const { title, helperText, tooltipText, className } = props;

    const { classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="object heading" className={classes.title}>
                {title}
            </Text>
            {tooltipText && (
                <Tooltip title={tooltipText}>
                    <Icon className={classes.helpIcon} iconId="help" size="small" />
                </Tooltip>
            )}
            {helperText && (
                <Text typo="body 2" className={classes.helperText}>
                    {helperText}
                </Text>
            )}
        </div>
    );
});
