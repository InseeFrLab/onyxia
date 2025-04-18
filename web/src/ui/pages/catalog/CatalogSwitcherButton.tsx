import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { type ReactNode } from "react";

export type Props = {
    className?: string;
    isSelected: boolean;
    onClick: () => void;
    text: ReactNode;
};

export function CatalogSwitcherButton(props: Props) {
    const { onClick, className, isSelected } = props;

    const { classes, cx } = useStyles();

    return (
        <div
            className={cx(classes.root, className)}
            color="secondary"
            onMouseDown={e => {
                e.preventDefault();
                if (e.button !== 0) {
                    return;
                }
                onClick();
            }}
        >
            <Text
                typo={isSelected ? "label 1" : "body 1"}
                color={!isSelected ? "secondary" : undefined}
            >
                {props.text}
            </Text>
        </div>
    );
}

const useStyles = tss.withName({ CatalogSwitcherButton }).create(({ theme }) => ({
    root: {
        padding: theme.spacing({ topBottom: 2, rightLeft: 3 }),
        display: "flex",
        alignItems: "center",
        cursor: "pointer"
    }
}));
