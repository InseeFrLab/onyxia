import { memo } from "react";
import { id } from "tsafe/id";
import { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { Item } from "../shared/types";
import { type IconProps } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { tss } from "tss";

type Props = {
    className?: string;
    /** Default: default */
    size?: IconProps["size"];
    ariaLabel?: string;
    policy: Item["policy"];
    changePolicy: () => void;
};

export const PolicySwitch = memo((props: Props) => {
    const { className, size, policy, changePolicy, ariaLabel } = props;

    const isPublic = policy === "public";

    const { classes, cx } = useStyles({ isPublic });

    return (
        <IconButton
            className={cx(classes.root, className)}
            onClick={changePolicy}
            size={size}
            icon={
                isPublic
                    ? id<MuiIconComponentName>("Visibility")
                    : id<MuiIconComponentName>("VisibilityOff")
            }
            aria-label={ariaLabel ?? "Policy switch"}
        />
    );
});

const useStyles = tss
    .withName({ PolicySwitch })
    .withParams<{
        isPublic: boolean;
    }>()
    .create(({ isPublic }) => ({
        "root": {
            "transition": "transform 500ms",
            "transform": `rotate(${isPublic ? 180 : 0}deg)`,
            "transitionTimingFunction": "cubic-bezier(.34,1.27,1,1)"
        }
    }));
