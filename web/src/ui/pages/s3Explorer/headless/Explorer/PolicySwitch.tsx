import { memo } from "react";
import type { Item } from "../shared/types";
import { type IconProps } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { tss } from "tss";
import { getIconUrlByName } from "lazy-icons";

type Props = {
    className?: string;
    /** Default: default */
    size?: IconProps["size"];
    ariaLabel?: string;
    policy: Item["policy"];
    changePolicy: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    isPolicyChanging: boolean; // New loading prop
    disabled?: boolean;
};

export const PolicySwitch = memo((props: Props) => {
    const {
        className,
        size,
        policy,
        changePolicy,
        ariaLabel,
        isPolicyChanging,
        disabled = false
    } = props;

    const isPublic = policy === "public";

    const { classes, cx } = useStyles({ isPublic, isPolicyChanging });

    return (
        <IconButton
            className={cx(classes.root, className)}
            onClick={changePolicy} // Prevent click if loading
            disabled={disabled || isPolicyChanging}
            size={size}
            icon={getIconUrlByName(isPublic ? "Visibility" : "VisibilityOff")}
            aria-label={ariaLabel ?? "Policy switch"}
        />
    );
});

const useStyles = tss
    .withName({ PolicySwitch })
    .withParams<{
        isPublic: boolean;
        isPolicyChanging: boolean;
    }>()
    .create(({ isPublic, isPolicyChanging }) => ({
        root: {
            animation: isPolicyChanging
                ? `${isPublic ? "spinClockwise" : "spinCounterClockwise"} 1s linear infinite`
                : "none", // Apply the corresponding animation
            "@keyframes spinClockwise": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" }
            },
            "@keyframes spinCounterClockwise": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(-360deg)" }
            }
        }
    }));
