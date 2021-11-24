import { memo } from "react";
import { makeStyles } from "app/theme";
import { Button, Text, Icon } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { IconButton } from "app/theme";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Tag } from "onyxia-ui/Tag";

export type Props = {
    className?: string;
    packageIconUrl?: string;
    friendlyName: string;
    packageName: string;
    onRequestDelete: (() => void) | undefined;
    onRequestShowPostInstallInstructions: (() => void) | undefined;
    onRequestShowEnv: () => void;
    openUrl: string | undefined;
    monitoringUrl: string | undefined;
    //Undefined when the service is not yey launched
    startTime: number | undefined;
    isOvertime: boolean;
    isShared: boolean;
};

export const MyServicesCard = memo((props: Props) => {
    const {
        className,
        packageIconUrl,
        friendlyName,
        packageName,
        onRequestDelete,
        onRequestShowPostInstallInstructions,
        onRequestShowEnv,
        monitoringUrl,
        openUrl,
        startTime,
        isOvertime,
        isShared,
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
                <div style={{ "flex": 1 }} />
                {isShared && <Icon iconId="people" />}
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.belowDividerTop}>
                    <div>
                        <Text typo="caption" className={classes.captions}>
                            {t("service")}
                        </Text>
                        <div className={classes.packageNameWrapper}>
                            <Text typo="label 1">{capitalize(packageName)}</Text>
                            {isShared && (
                                <Tag className={classes.sharedTag} text={t("shared")} />
                            )}
                        </div>
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
                    <IconButton iconId="infoOutlined" onClick={onRequestShowEnv} />
                    {onRequestDelete !== undefined && (
                        <IconButton iconId="delete" onClick={onRequestDelete} />
                    )}
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
        readme: undefined;
        shared: undefined;
    };
}

const useStyles = makeStyles({ "label": { MyServicesCard } })(theme => ({
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
        "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
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
        "marginLeft": theme.spacing(6),
    },
    "belowDividerTop": {
        "display": "flex",
        "marginBottom": theme.spacing(4),
    },
    "captions": {
        "display": "inline-block",
        "marginBottom": theme.spacing(2),
    },
    "packageNameWrapper": {
        "& > *": {
            "display": "inline-block",
        },
    },
    "sharedTag": {
        "marginLeft": theme.spacing(2),
    },
    "belowDividerBottom": {
        "display": "flex",
        "alignItems": "center",
    },
}));
