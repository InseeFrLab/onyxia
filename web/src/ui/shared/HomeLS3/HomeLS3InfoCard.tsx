import type { ReactNode } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import type { Link } from "ui/routes";
import { Text } from "onyxia-ui/Text";

export type Props = {
    className?: string;
    title: ReactNode;
    body: ReactNode;
    icon: string;
    buttonText: ReactNode;
    link: Link;
};

export function HomeLS3InfoCard(props: Props) {
    const { className, title, body, icon, buttonText, link } = props;

    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <Text className={classes.title} typo="object heading">
                {title}
            </Text>
            <Text className={classes.body} typo="body 1">
                {body}
            </Text>
            <Button className={classes.button} startIcon={icon} {...link}>
                {buttonText}
            </Button>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3InfoCard }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 200,
        padding: theme.spacing(4),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        borderRadius: theme.spacing(2)
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    body: {
        maxWidth: 560,
        marginTop: theme.spacing(2),
        color: theme.colors.useCases.typography.textSecondary
    },
    button: {
        alignSelf: "flex-end",
        marginTop: "auto"
    }
}));
