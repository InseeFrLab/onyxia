import { useEffect } from "react";
import { useCore, useCoreState } from "core";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import Color from "color";
import { CircularMetric } from "ui/shared/CircularMetric";
import { declareComponentKeys, useTranslation } from "ui/i18n";

const countdownStartsAtSecondsLeft = 60;

type Props = {
    className?: string;
};

export function AutoLogoutCountdown(props: Props) {
    const { className } = props;

    const { t } = useTranslation({ AutoLogoutCountdown });

    const { autoLogoutCountdown } = useCore().functions;

    useEffect(() => {
        const { setInactive } = autoLogoutCountdown.setActive({
            countdownStartsAtSecondsLeft
        });

        return setInactive;
    }, []);

    const { secondsLeft } = useCoreState("autoLogoutCountdown", "main");

    const { classes, cx } = useStyles();

    if (secondsLeft === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.textWrapper}>
                <CircularMetric
                    className={classes.circularMetric}
                    percentage={100 - (secondsLeft / countdownStartsAtSecondsLeft) * 100}
                    severity="warning"
                    isInverted={true}
                >
                    {secondsLeft}
                </CircularMetric>
                <Text typo="label 1">{t("are you still there")}</Text>
                <Text typo="label 1">{t("you'll soon be automatically logged out")}</Text>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ AutoLogoutCountdown }).create(({ theme }) => ({
    root: {
        position: "absolute",
        zIndex: 3,
        height: "100%",
        width: "100%",
        top: 0,
        left: 0,
        backgroundColor: (() => {
            const color = new Color(theme.colors.useCases.surfaces.background).rgb();

            return color.alpha(0.6).string();
        })(),
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    circularMetric: {
        marginBottom: theme.spacing(4)
    },
    textWrapper: {
        textAlign: "center"
    }
}));

const { i18n } = declareComponentKeys<
    "are you still there" | "you'll soon be automatically logged out"
>()({ AutoLogoutCountdown });
export type I18n = typeof i18n;
