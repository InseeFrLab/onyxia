import { memo } from "react";
import Avatar from "@mui/material/Avatar";
import fallbackSvgUrl from "ui/assets/svg/singlePackage.svg";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import { tss } from "tss";
import type { IconSizeName } from "onyxia-ui";

export type RoundLogoProps = {
    className?: string;
    url: string | undefined;
    size?: IconSizeName;
};

export const RoundLogo = memo((props: RoundLogoProps) => {
    const { url, size = "default", className } = props;

    const { classes, cx } = useStyles({ iconSizeName: size });

    return (
        <Avatar src={url} className={cx(classes.root, className)}>
            <ThemedImage className={classes.fallback} url={fallbackSvgUrl} />
        </Avatar>
    );
});

const useStyles = tss
    .withName({ RoundLogo })
    .withParams<{ iconSizeName: IconSizeName }>()
    .create(({ theme, iconSizeName }) => ({
        fallback: {
            fill: theme.colors.useCases.typography.textPrimary
        },
        root: {
            ...(() => {
                const size = theme.iconSizesInPxByName[iconSizeName];

                return {
                    width: size,
                    height: size
                };
            })()
        }
    }));
