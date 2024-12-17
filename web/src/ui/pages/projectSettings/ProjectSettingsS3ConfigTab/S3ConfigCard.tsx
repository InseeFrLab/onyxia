import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import { TestS3ConnectionButton } from "./TestS3ConnectionButton";
import { Icon } from "onyxia-ui/Icon";
import Tooltip from "@mui/material/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { S3Config } from "core/usecases/s3ConfigManagement";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    s3Config: S3Config;
    onDelete: (() => void) | undefined;
    onIsExplorerConfigChange: (value: boolean) => void;
    onIsOnyxiaDefaultChange: (value: boolean) => void;
    onEdit: (() => void) | undefined;
    onTestConnection: (() => void) | undefined;
    canInjectPersonalInfos: boolean;
};

export function S3ConfigCard(props: Props) {
    const {
        className,
        s3Config,
        onDelete,
        onIsExplorerConfigChange,
        onIsOnyxiaDefaultChange,
        onEdit,
        onTestConnection,
        canInjectPersonalInfos
    } = props;

    const { classes, cx, css, theme } = useStyles();

    const { t } = useTranslation({ S3ConfigCard });

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.line}>
                <Text typo="label 1">{t("data source")}:</Text>
                &nbsp; &nbsp;
                <Text typo="body 1">
                    <code
                        className={css({
                            fontSize: "0.9rem"
                        })}
                    >
                        {s3Config.dataSource}
                    </code>
                    {s3Config.region === "" ? null : <>&nbsp;-&nbsp;{s3Config.region}</>}
                </Text>
            </div>
            <div className={classes.line}>
                {(() => {
                    switch (s3Config.origin) {
                        case "deploymentRegion":
                            return (
                                <>
                                    <Text typo="label 1">{t("credentials")}:</Text>
                                    &nbsp; &nbsp;
                                    <Text typo="body 1">{t("sts credentials")}</Text>
                                </>
                            );
                        case "project":
                            return (
                                <>
                                    <Text typo="label 1">{t("account")}:</Text>
                                    &nbsp; &nbsp;
                                    <Text typo="body 1">{s3Config.friendlyName}</Text>
                                </>
                            );
                    }
                })()}
            </div>
            <div className={classes.line}>
                <Text typo="label 1">{t("use in services")}</Text>
                <Tooltip title={t("use in services helper")}>
                    <Icon className={classes.helpIcon} icon={getIconUrlByName("Help")} />
                </Tooltip>
                &nbsp;
                <Switch
                    disabled={
                        canInjectPersonalInfos
                            ? false
                            : s3Config.origin === "deploymentRegion"
                    }
                    checked={
                        canInjectPersonalInfos || s3Config.origin !== "deploymentRegion"
                            ? s3Config.isXOnyxiaDefault
                            : false
                    }
                    onChange={event => onIsOnyxiaDefaultChange(event.target.checked)}
                    inputProps={{ "aria-label": "controlled" }}
                />
            </div>
            <div className={classes.line}>
                <Text typo="label 1">{t("use for onyxia explorers")}</Text>
                <Tooltip title={t("use for onyxia explorers helper")}>
                    <Icon className={classes.helpIcon} icon={getIconUrlByName("Help")} />
                </Tooltip>
                &nbsp;
                <Switch
                    checked={s3Config.isExplorerConfig}
                    onChange={event => onIsExplorerConfigChange(event.target.checked)}
                    inputProps={{ "aria-label": "controlled" }}
                />
            </div>
            <div
                className={css({
                    marginTop: theme.spacing(4),
                    display: "flex"
                })}
            >
                {s3Config.origin === "project" &&
                    (assert(onTestConnection !== undefined),
                    (
                        <TestS3ConnectionButton
                            className={css({})}
                            connectionTestStatus={s3Config.connectionTestStatus}
                            onTestConnection={onTestConnection}
                        />
                    ))}
                <div className={css({ flex: 1 })} />
                <div
                    className={css({
                        display: "flex",
                        gap: theme.spacing(2)
                    })}
                >
                    {onEdit !== undefined && (
                        <Button
                            variant="secondary"
                            startIcon={getIconUrlByName("Edit")}
                            onClick={() => onEdit()}
                        >
                            {t("edit")}
                        </Button>
                    )}
                    {onDelete !== undefined && (
                        <Button
                            variant="secondary"
                            startIcon={getIconUrlByName("Delete")}
                            onClick={() => onDelete()}
                        >
                            {t("delete")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

const useStyles = tss.withName({ S3ConfigCard }).create(({ theme }) => ({
    root: {
        padding: theme.spacing(3),
        borderRadius: theme.spacing(2),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[3],
        "&:hover": {
            boxShadow: theme.shadows[6]
        }
    },
    line: {
        marginBottom: theme.spacing(3),
        display: "flex",
        alignItems: "center"
    },
    helpIcon: {
        marginLeft: theme.spacing(2),
        fontSize: "inherit",
        ...(() => {
            const factor = 1.1;
            return { width: `${factor}em`, height: `${factor}em` };
        })()
    }
}));

const { i18n } = declareComponentKeys<
    | "data source"
    | "credentials"
    | "sts credentials"
    | "account"
    | "use in services"
    | "use in services helper"
    | "use for onyxia explorers"
    | "use for onyxia explorers helper"
    | "edit"
    | "delete"
>()({ S3ConfigCard });
export type I18n = typeof i18n;
