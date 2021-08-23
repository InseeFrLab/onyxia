import { memo } from "react";
import type { IconId } from "app/theme";
import { makeStyles } from "app/theme";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { ButtonBarButton } from "./ButtonBarButton";

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

const useStyles = makeStyles()(theme => ({
    "root": {
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "boxShadow": theme.shadows[1],
        "borderRadius": 8,
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
                    <ButtonBarButton
                        startIcon={icon}
                        disabled={isDisabled}
                        key={buttonId}
                        onClick={onClickFactory(buttonId)}
                    >
                        {label}
                    </ButtonBarButton>
                ))}
            </div>
        );
    },
);
