import { memo } from "react";
import { makeStyles } from "ui/theme";
import { RoundLogo } from "ui/components/shared/RoundLogo";

export type Props = {
    className?: string;
    severity: "success" | "error" | "warning" | "pending";
    url: string | undefined;
};

export const MyServicesRoundLogo = memo((props: Props) => {
    const { className, url, severity } = props;

    const { classes, cx } = useStyles({ severity });

    return (
        <div className={cx(className, classes.root)}>
            <RoundLogo url={url} size="large" />
        </div>
    );
});

const useStyles = makeStyles<{
    severity: Props["severity"];
}>({ "name": { MyServicesRoundLogo } })((theme, { severity }) => ({
    "root": {
        "borderColor": (() => {
            switch (severity) {
                case "pending":
                    return theme.colors.palette[
                        theme.isDarkModeEnabled ? "dark" : "light"
                    ].greyVariant2;
                default:
                    return theme.colors.useCases.alertSeverity[severity].main;
            }
        })(),
        "borderStyle": "solid",
        "borderWidth": 3,
        "padding": 2,
        "borderRadius": "50%",
        "boxSizing": "border-box",
        "display": "inline-block"
    }
}));
