import { memo } from "react";
import { makeStyles } from "app/theme";
import { Button, Text } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";

import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { IconButton } from "app/theme";
import { CircularProgress } from "onyxia-ui/CircularProgress";

const useStyles = makeStyles()(theme => ({
    "root": {
        "borderRadius": 8,
        "boxShadow": theme.shadows[1],
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "&:hover": {
            "boxShadow": theme.shadows[6],
        },
        "display": "flex",
        "flexDirection": "column",
    },
    "aboveDivider": {
        "padding": theme.spacing(3, 4),
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "boxSizing": "border-box",
        "display": "flex",
        "alignItems": "center",
    },
    "title": {
        "marginLeft": theme.spacing(3),
    },
    "belowDivider": {
        "padding": theme.spacing(4),
        "paddingTop": theme.spacing(3),
        "flex": 1,
    },
    "timeContainer": {
        "marginLeft": theme.spacing(5),
    },
    "belowDividerTop": {
        "display": "flex",
        "marginBottom": theme.spacing(4),
    },
    "captions": {
        "display": "inline-block",
        "marginBottom": theme.spacing(2),
    },
    "belowDividerBottom": {
        "display": "flex",
        "alignItems": "center",
    },
}));

export type Props = {
    className?: string;
    packageIconUrl?: string;
    friendlyName: string;
    packageName: string;
    infoUrl: string;
    onRequestDelete(): void;
    onRequestShowPostInstallInstructions: (() => void) | undefined;
    openUrl: string | undefined;
    monitoringUrl: string | undefined;
    //Undefined when the service is not yey launched
    startTime: number | undefined;
    isOvertime: boolean;
};

export const MyServicesCard = memo((props: Props) => {
    const {
        className,
        packageIconUrl,
        friendlyName,
        packageName,
        infoUrl,
        onRequestDelete,
        onRequestShowPostInstallInstructions,
        monitoringUrl,
        openUrl,
        startTime,
        isOvertime,
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation("MyServicesCard");

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <MyServicesRoundLogo
                    url={packageIconUrl}
                    circleColor={
                        isOvertime ? "red" : startTime === undefined ? "grey" : "green"
                    }
                />
                <Text className={classes.title} typo="object heading">
                    {capitalize(friendlyName)}
                </Text>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.belowDividerTop}>
                    <div>
                        <Text typo="caption" className={classes.captions}>
                            {t("service")}
                        </Text>
                        <Text typo="label 1">{capitalize(packageName)}</Text>
                    </div>
                    <div className={classes.timeContainer}>
                        <Text typo="caption" className={classes.captions}>
                            {t("running since")}
                        </Text>
                        {startTime === undefined ? (
                            <MyServicesRunningTime isRunning={false} />
                        ) : (
                            <MyServicesRunningTime
                                isRunning={true}
                                isOvertime={isOvertime}
                                startTime={startTime}
                            />
                        )}
                    </div>
                </div>
                <div className={classes.belowDividerBottom}>
                    <IconButton
                        iconId="infoOutlined"
                        doOpenNewTabIfHref={false}
                        href={infoUrl}
                    />
                    <IconButton iconId="delete" onClick={onRequestDelete} />
                    {monitoringUrl !== undefined && (
                        <IconButton iconId="equalizer" href={monitoringUrl} />
                    )}
                    {onRequestShowPostInstallInstructions !== undefined && (
                        <Button
                            onClick={onRequestShowPostInstallInstructions}
                            variant="ternary"
                        >
                            <span>{t("readme").toUpperCase()}</span>
                        </Button>
                    )}
                    <div style={{ "flex": 1 }} />
                    {startTime === undefined ? (
                        <CircularProgress color="textPrimary" size={20} />
                    ) : (
                        openUrl && (
                            <Button variant="secondary" href={openUrl}>
                                {t("open")}
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
});

export declare namespace MyServicesCard {
    export type I18nScheme = {
        service: undefined;
        "running since": undefined;
        open: undefined;
        "readme": undefined;
    };
}
