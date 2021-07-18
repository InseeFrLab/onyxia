import { memo } from "react";
import Avatar from "@material-ui/core/Avatar";
import { ReactComponent as FallbackSvg } from "app/assets/svg/singlePackage.svg";
import { makeStyles } from "app/theme";

export type RoundLogoProps = {
    className?: string;
    url: string | undefined;
};

const { useStyles } = makeStyles()(theme => ({
    "fallback": {
        "fill": theme.colors.useCases.typography.textPrimary,
    },
}));

export const RoundLogo = memo((props: RoundLogoProps) => {
    const { url, className } = props;

    const { classes } = useStyles();

    return (
        <Avatar src={url} className={className}>
            <FallbackSvg className={classes.fallback} />
        </Avatar>
    );
});
