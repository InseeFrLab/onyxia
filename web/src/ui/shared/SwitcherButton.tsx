import { tss } from "tss";
import Button from "@mui/material/Button";
import { ReactNode } from "react";

export type Props = {
    className?: string;
    isSelected: boolean;
    onClick: () => void;
    text: ReactNode;
};

export function SwitcherButton(props: Props) {
    const { onClick, className, isSelected, text } = props;

    const { classes, cx } = useStyles({ isSelected });

    return (
        <Button
            variant="text"
            disableTouchRipple
            className={cx(classes.root, className)}
            onClick={onClick}
        >
            {text}
        </Button>
    );
}

const useStyles = tss
    .withName({ SwitcherButton })
    .withParams<{ isSelected: boolean }>()
    .create(({ theme, isSelected }) => ({
        root: {
            ...theme.typography.variants[isSelected ? "label 1" : "body 1"].style,
            color: !isSelected
                ? theme.colors.useCases.typography.textSecondary
                : theme.colors.useCases.typography.textPrimary,
            textTransform: "none",
            padding: theme.spacing({ topBottom: 2, rightLeft: 3 })
        }
    }));
