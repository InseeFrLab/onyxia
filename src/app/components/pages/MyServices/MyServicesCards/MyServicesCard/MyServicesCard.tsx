

import { memo } from "react";
import { createUseClassNames } from "app/theme";
import { Typography } from "onyxia-ui";
import { Button } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";
import { capitalize } from "app/tools/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { IconButton } from "app/theme";
import { CircularProgress } from "onyxia-ui";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.shadows[1],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.shadows[6]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "boxSizing": "border-box"
        },
        "title": {
            "marginTop": theme.spacing(2)
        },
        "belowDivider": {
            "padding": theme.spacing(3),
            "paddingTop": theme.spacing(2),
            "flex": 1,
        },
        "timeContainer": {
            "marginLeft": theme.spacing(4)
        },
        "belowDividerTop": {
            "display": "flex",
            "marginBottom": theme.spacing(3)
        },
        "captions": {
            "display": "inline-block",
            "marginBottom": theme.spacing(1)
        },
        "belowDividerBottom": {
            "display": "flex",
            "alignItems": "center"
        }
    })
);

export type Props = {
    className?: string;
    packageIconUrl?: string;
    friendlyName: string;
    packageName: string;
    infoUrl: string;
    onRequestDelete(): void;
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
        monitoringUrl,
        openUrl,
        startTime,
        isOvertime
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("MyServicesCard");

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                <MyServicesRoundLogo
                    url={packageIconUrl}
                    circleColor={isOvertime ? "red" : startTime === undefined ? "grey" : "green"}
                />
                <Typography
                    className={classNames.title}
                    variant="h5"
                >
                    {capitalize(friendlyName)}
                </Typography>

            </div>
            <div className={classNames.belowDivider}>
                <div className={classNames.belowDividerTop}>
                    <div>
                        <Typography
                            variant="caption"
                            className={classNames.captions}
                        >
                            {t("service")}
                        </Typography>
                        <Typography variant="subtitle1">
                            {capitalize(packageName)}
                        </Typography>
                    </div>
                    <div className={classNames.timeContainer}>
                        <Typography
                            variant="caption"
                            className={classNames.captions}
                        >
                            {t("running since")}
                        </Typography>
                        {
                            startTime === undefined ?
                                <MyServicesRunningTime isRunning={false} /> :
                                <MyServicesRunningTime isRunning={true} isOvertime={isOvertime} startTime={startTime} />
                        }
                    </div>
                </div>
                <div className={classNames.belowDividerBottom}>
                    <IconButton id="infoOutlined" doOpenNewTabIfHref={false} href={infoUrl} />
                    <IconButton id="delete" onClick={onRequestDelete} />
                    {monitoringUrl !== undefined &&
                        <IconButton id="equalizer" href={monitoringUrl} />}
                    <div style={{ "flex": 1 }} />
                    {startTime === undefined ?
                        <CircularProgress color="textPrimary" size={20} />
                        :
                        openUrl &&
                        <Button
                            color="secondary"
                            href={openUrl}
                        >{t("open")}</Button>
                    }
                </div>

            </div>
        </div>
    );

});

export declare namespace MyServicesCard {

    export type I18nScheme = {
        service: undefined;
        'running since': undefined;
        open: undefined;
    };
}
