import { Fragment, useMemo, memo } from "react";
import { makeStyles } from "ui/theme";
import { Button, Text, Icon, IconButton } from "ui/theme";
import { useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Tag } from "onyxia-ui/Tag";
import { Tooltip } from "onyxia-ui/Tooltip";
import { exclude } from "tsafe/exclude";
import { objectKeys } from "tsafe/objectKeys";
import { fromNow } from "ui/useMoment";
import { evtLang } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";

const runningTimeThreshold = 7 * 24 * 3600 * 1000;

function getDoesHaveBeenRunningForTooLong(params: { startTime: number }): boolean {
    const { startTime } = params;

    return Date.now() - startTime > runningTimeThreshold;
}

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
    /** undefined when the service is not yey launched */
    startTime: number | undefined;
    isShared: boolean;
    isOwned: boolean;
    /** undefined when isOwned === true*/
    ownerUsername: string | undefined;
    vaultTokenExpirationTime: number | undefined;
    s3TokenExpirationTime: number | undefined;
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
        isShared,
        isOwned,
        ownerUsername,
        vaultTokenExpirationTime,
        s3TokenExpirationTime,
    } = props;

    const { t } = useTranslation({ MyServicesCard });

    const tokensStatus = useMemo(() => {
        const getTokenStatus = (expirationTime: number) =>
            ({
                "status": (() => {
                    const remainingMs = expirationTime - Date.now();

                    if (remainingMs < 0) {
                        return "expired";
                    }

                    if (remainingMs < 6 * 3600 * 1000) {
                        return "expires soon";
                    }

                    return "valid";
                })(),
                expirationTime,
            } as const);

        return {
            "s3":
                s3TokenExpirationTime === undefined
                    ? undefined
                    : getTokenStatus(s3TokenExpirationTime),
            "vault":
                vaultTokenExpirationTime === undefined
                    ? undefined
                    : getTokenStatus(vaultTokenExpirationTime),
        };
    }, [vaultTokenExpirationTime, s3TokenExpirationTime]);

    const severity = useMemo(
        () =>
            startTime === undefined
                ? "pending"
                : (() => {
                      const statues = Object.entries(tokensStatus)
                          .map(([, value]) => value)
                          .filter(exclude(undefined))
                          .map(({ status }) => status);

                      if (statues.includes("expired")) {
                          return "error";
                      }

                      if (
                          statues.includes("expires soon") ||
                          getDoesHaveBeenRunningForTooLong({ startTime })
                      ) {
                          return "warning";
                      }

                      return "success";
                  })(),
        [startTime, tokensStatus],
    );

    const { classes, cx } = useStyles({
        "severity": (() => {
            switch (severity) {
                case "success":
                case "pending":
                    return undefined;
                default:
                    return severity;
            }
        })(),
    });

    const tooltipTitle = useMemo(
        () => (
            <>
                {[
                    ...objectKeys(tokensStatus)
                        // eslint-disable-next-line array-callback-return
                        .map(tokenType => {
                            const wrap = tokensStatus[tokenType];

                            if (wrap === undefined) {
                                return undefined;
                            }

                            const { status, expirationTime } = wrap;

                            switch (status) {
                                case "valid":
                                    return undefined;
                                case "expires soon":
                                    return (
                                        <Fragment key={tokenType}>
                                            {t("which token expire when", {
                                                "which": tokenType,
                                                "howMuchTime": fromNow({
                                                    "lang": evtLang.state,
                                                    "dateTime": expirationTime,
                                                }),
                                            })}
                                            <br />
                                        </Fragment>
                                    );
                                case "expired":
                                    return (
                                        <Fragment key={tokenType}>
                                            {t("which token expired", {
                                                "which": tokenType,
                                            })}
                                            <br />
                                        </Fragment>
                                    );
                            }
                        })
                        .filter(exclude(undefined)),
                    <Fragment key={"reminder"}>
                        {t("reminder to delete services")}
                    </Fragment>,
                ]}
            </>
        ),
        [tokensStatus, t],
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <MyServicesRoundLogo url={packageIconUrl} severity={severity} />
                <Text className={classes.title} typo="object heading">
                    {capitalize(friendlyName)}
                </Text>
                <div style={{ "flex": 1 }} />
                {isShared && (
                    <Tooltip title={t("this is a shared service")}>
                        <Icon iconId="people" />
                    </Tooltip>
                )}
                <Tooltip title={tooltipTitle}>
                    <Icon iconId="errorOutline" className={classes.errorOutlineIcon} />
                </Tooltip>
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
                                <Tag
                                    className={classes.sharedTag}
                                    text={isOwned ? t("shared by you") : ownerUsername!}
                                />
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
                                doesHaveBeenRunningForTooLong={getDoesHaveBeenRunningForTooLong(
                                    { startTime },
                                )}
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

export const { i18n } = declareComponentKeys<
    | "service"
    | "running since"
    | "open"
    | "readme"
    | "shared by you"
    | { K: "which token expire when"; P: { which: "vault" | "s3"; howMuchTime: string } }
    | { K: "which token expired"; P: { which: "vault" | "s3" } }
    | "reminder to delete services"
    | "this is a shared service"
>()({ MyServicesCard });

const useStyles = makeStyles<{
    severity: "error" | "warning" | undefined;
}>({ "name": { MyServicesCard } })((theme, { severity }) => ({
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
    "errorOutlineIcon":
        severity === undefined
            ? { "display": "none" }
            : {
                  "marginLeft": theme.spacing(3),
                  "color": theme.colors.useCases.alertSeverity[severity].main,
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
