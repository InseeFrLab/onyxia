import { memo } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "onyxia-ui/Tooltip";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
    title: string;
    helperText?: ReactNode;
    tooltipText?: string;
};

export const SettingSectionHeader = memo((props: Props) => {
    const { title, helperText, tooltipText, className } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="object heading" className={classes.title}>
                {title}
            </Text>
            {tooltipText && (
                <Tooltip title={tooltipText}>
                    <Icon
                        className={classes.helpIcon}
                        icon={getIconUrlByName("Help")}
                        size="small"
                    />
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

const useStyles = tss.withName({ SettingSectionHeader }).create(({ theme }) => ({
    root: {
        marginBottom: theme.spacing(4)
    },
    title: {
        display: "inline-block"
    },
    helperText: {
        marginTop: theme.spacing(2)
    },
    helpIcon: {
        marginLeft: theme.spacing(2)
    }
}));
