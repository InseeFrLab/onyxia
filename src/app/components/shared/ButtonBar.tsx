import { memo } from "react";
import type { IconId } from "app/theme";
import { makeStyles, Button } from "app/theme";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";

export type ButtonBarProps<ButtonId extends string> = {
    className?: string;
    buttons: {
        buttonId: ButtonId;
        icon: IconId;
        label: string;
        isDisabled: boolean;
    }[];
    onClick(buttonId: ButtonId): void;
};

const { useStyles } = makeStyles()(theme => ({
    "root": {
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "boxShadow": theme.shadows[1],
        "borderRadius": "8px 0 0 8px",
        "overflow": "hidden",
    },
}));

export const ButtonBar = memo(
    <ButtonId extends string>(props: ButtonBarProps<ButtonId>) => {
        const { className, buttons, onClick } = props;

        const { classes, cx } = useStyles();

        const onClickFactory = useCallbackFactory(([buttonId]: [ButtonId]) =>
            onClick(buttonId),
        );

        return (
            <div className={cx(classes.root, className)}>
                {buttons.map(({ buttonId, icon, isDisabled, label }) => (
                    <CustomButton
                        startIcon={icon}
                        disabled={isDisabled}
                        key={buttonId}
                        onClick={onClickFactory(buttonId)}
                        label={label}
                    />
                ))}
            </div>
        );
    },
);

const { CustomButton } = (() => {
    type CustomButtonProps = {
        startIcon: IconId;
        disabled: boolean;
        onClick(): void;
        label: string;
    };

    const { useStyles } = makeStyles<CustomButtonProps>()(theme => ({
        "root": {
            "backgroundColor": "transparent",
            "borderRadius": "unset",
            "borderColor": "transparent",
            "&.Mui-disabled .MuiButton-label": {
                "color": theme.colors.useCases.typography.textDisabled,
            },
            "& .MuiButton-label": {
                "color": theme.colors.useCases.typography.textPrimary,
            },
            "&:active .MuiButton-label": {
                "color": theme.colors.useCases.typography.textFocus,
                "& .MuiSvgIcon-root": {
                    "color": theme.colors.useCases.typography.textFocus,
                },
            },
            "& .MuiTouchRipple-root": {
                "display": "none",
            },
            "transition": "none",
            "& > *": {
                "transition": "none",
            },
            "&:hover": {
                "borderBottomColor": theme.colors.useCases.buttons.actionActive,
                "boxSizing": "border-box",
                "backgroundColor": "unset",
                "& .MuiSvgIcon-root": {
                    "color": theme.colors.useCases.typography.textPrimary,
                },
            },
        },
    }));

    const CustomButton = memo((props: CustomButtonProps) => {
        const { startIcon, disabled, onClick, label } = props;

        const { classes } = useStyles(props);

        return (
            <Button
                className={classes.root}
                variant="secondary"
                startIcon={startIcon}
                {...{ disabled, onClick }}
            >
                {label}
            </Button>
        );
    });

    return { CustomButton };
})();
