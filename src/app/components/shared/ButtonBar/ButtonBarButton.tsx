import type { ReactNode } from "react";
import { memo } from "react";
import type { IconId } from "app/theme";
import { makeStyles, Button } from "app/theme";

export type ButtonBarButtonProps =
    | ButtonBarButtonProps.Clickable
    | ButtonBarButtonProps.Link
    | ButtonBarButtonProps.Submit;

export namespace ButtonBarButtonProps {
    type Common = {
        className?: string;

        startIcon?: IconId;
        disabled?: boolean;
        children: NonNullable<ReactNode>;
    };

    export type Clickable = Common & {
        onClick(): void;
        href?: string;
    };

    export type Link = Common & {
        href: string;
        /** Defaults to true */
        doOpenNewTabIfHref?: boolean;
    };

    export type Submit = Common & {
        type: "submit";
    };
}

const useStyles = makeStyles<ButtonBarButtonProps>()(theme => ({
    "root": {
        "backgroundColor": "transparent",
        "borderRadius": "unset",
        "borderColor": "transparent",
        "& .MuiTouchRipple-root": {
            "display": "none",
        },
        "transition": "none",
        "& > *": {
            "transition": "none",
        },
        "&:hover.MuiButton-text": {
            "color": theme.colors.useCases.typography.textPrimary,
            "borderBottomColor": theme.colors.useCases.buttons.actionActive,
            "boxSizing": "border-box",
            "backgroundColor": "unset",
            "& .MuiSvgIcon-root": {
                "color": theme.colors.useCases.typography.textPrimary,
            },
        },
        "&:active.MuiButton-text": {
            "color": theme.colors.useCases.typography.textFocus,
            "& .MuiSvgIcon-root": {
                "color": theme.colors.useCases.typography.textFocus,
            },
        },
    },
}));

export const ButtonBarButton = memo((props: ButtonBarButtonProps) => {
    const { className, startIcon, disabled, children, ...rest } = props;

    const { classes, cx } = useStyles(props);

    return (
        <Button
            className={cx(classes.root, className)}
            variant="secondary"
            startIcon={startIcon}
            disabled={disabled}
            {...rest}
        >
            {children}
        </Button>
    );
});
