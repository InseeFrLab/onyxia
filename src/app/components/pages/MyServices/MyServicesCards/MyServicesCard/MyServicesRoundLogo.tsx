import { memo } from "react";
import { makeStyles } from "app/theme";
import { RoundLogo } from "app/components/shared/RoundLogo";

export type Props = {
    className?: string;
    circleColor: "red" | "green" | "grey";
    url: string | undefined;
};

const { useStyles } = makeStyles<{
    circleColor: Props["circleColor"];
}>()((theme, { circleColor }) => ({
    "root": {
        "borderColor": (() => {
            switch (circleColor) {
                case "green":
                    return theme.colors.palette.limeGreen.main;
                case "red":
                    return theme.colors.useCases.alertSeverity.error.main;
                case "grey":
                    return theme.colors.palette[
                        theme.isDarkModeEnabled ? "dark" : "light"
                    ].greyVariant2;
            }
        })(),
        "borderStyle": "solid",
        "borderWidth": 3,
        "padding": 2,
        "borderRadius": "50%",
        "boxSizing": "border-box",
        "display": "inline-block",
    },
    "logo": {
        ...(() => {
            const width = 50;
            return { width, "height": width };
        })(),
    },
}));

export const MyServicesRoundLogo = memo((props: Props) => {
    const { className, url, circleColor } = props;

    const { classes, cx } = useStyles({ circleColor });

    return (
        <div className={cx(className, classes.root)}>
            <RoundLogo url={url} className={classes.logo} />
        </div>
    );
});
