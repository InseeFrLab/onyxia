import { makeStyles, Text } from "app/theme";
import { memo } from "react";
import { Icon } from "app/theme";
import type { PickOptionals } from "tsafe";
import { noUndefined } from "app/tools/noUndefined";
import type { IconId } from "app/theme";

export type Props = {
    icon: IconId;
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
    className?: string | null;
};

export const defaultProps: PickOptionals<Props> = {
    "className": null,
};

const useStyles = makeStyles<Required<Props>>()(theme => ({
    "root": {
        "backgroundColor": "inherit",
        "paddingBottom": theme.spacing(5),
    },
    "text1": {
        "marginBottom": theme.spacing(3),
        "display": "flex",
        "alignItems": "center",
    },
    "icon": {
        "marginRight": theme.spacing(3),
        "position": "relative",
        "fontSize": 40,
    },
    "text2": {
        "marginBottom": theme.spacing(2),
    },
}));

export const PageHeader = memo((props: Props) => {
    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { icon, text1, text2, text3, className } = completedProps;

    const { classes, cx } = useStyles(completedProps);

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="page heading" className={classes.text1}>
                <Icon iconId={icon} className={classes.icon} />
                {text1}
            </Text>
            <Text typo="object heading" className={classes.text2}>
                {text2}
            </Text>
            <Text typo="body 1">{text3}</Text>
        </div>
    );
});
