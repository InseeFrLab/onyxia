import { memo } from "react";
import { tss } from "tss";
import { RoundLogo } from "ui/shared/RoundLogo";

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

const useStyles = tss
    .withParams<{ severity: Props["severity"] }>()
    .withName({ MyServicesRoundLogo })
    .create(({ theme, severity }) => ({
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
