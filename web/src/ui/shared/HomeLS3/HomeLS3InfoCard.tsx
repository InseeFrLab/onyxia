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
            <Text typo="object heading">{title}</Text>
            <Text typo="body 1">{body}</Text>
            <Button startIcon={icon} {...link}>
                {buttonText}
            </Button>
        </div>
    );
}

const useStyles = tss.withName({ HomeLS3InfoCard }).create(() => ({
    root: {}
}));
