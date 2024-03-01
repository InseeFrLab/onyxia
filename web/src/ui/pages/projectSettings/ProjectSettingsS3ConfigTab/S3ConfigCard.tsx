import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import type { ConnectionTestStatus } from "core/usecases/s3ConfigManagement";
import { TestS3ConnectionButton } from "./TestS3ConnectionButton";
import { Icon } from "onyxia-ui/Icon";
import Tooltip from "@mui/material/Tooltip";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    dataSource: string;
    region: string;
    accountFriendlyName: string | undefined;
    isUsedForExplorer: boolean;
    isUsedForXOnyxia: boolean;
    onDelete: (() => void) | undefined;
    onIsUsedForExplorerValueChange: ((isUsed: boolean) => void) | undefined;
    onIsUsedForXOnyxiaValueChange: ((isUsed: boolean) => void) | undefined;
    onEdit: (() => void) | undefined;
    doHideUsageSwitches: boolean;
    connectionTestStatus: ConnectionTestStatus | undefined;
    onTestConnection: (() => void) | undefined;
};

export function S3ConfigCard(props: Props) {
    const {
        className,
        dataSource,
        region,
        accountFriendlyName,
        isUsedForExplorer,
        isUsedForXOnyxia,
        onDelete,
        onIsUsedForExplorerValueChange,
        onIsUsedForXOnyxiaValueChange,
        doHideUsageSwitches,
        onEdit,
        connectionTestStatus,
        onTestConnection
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
                            "fontSize": "0.9rem"
                        })}
                    >
                        {dataSource}
                    </code>
                    {region === "" ? null : <>&nbsp;-&nbsp;{region}</>}
                </Text>
            </div>
            <div className={classes.line}>
                {accountFriendlyName === undefined ? (
                    <>
                        <Text typo="label 1">{t("credentials")}:</Text>
                        &nbsp; &nbsp;
                        <Text typo="body 1">{t("sts credentials")}</Text>
                    </>
                ) : (
                    <>
                        <Text typo="label 1">{t("account")}:</Text>
                        &nbsp; &nbsp;
                        <Text typo="body 1">{accountFriendlyName}</Text>
                    </>
                )}
            </div>
            {!doHideUsageSwitches && (
                <>
                    <div className={classes.line}>
                        <Text typo="label 1">{t("use in services")}</Text>
                        <Tooltip title={t("use in services helper")}>
                            <Icon
                                className={classes.helpIcon}
                                icon={id<MuiIconComponentName>("Help")}
                            />
                        </Tooltip>
                        &nbsp;
                        <Switch
                            checked={isUsedForXOnyxia}
                            disabled={onIsUsedForXOnyxiaValueChange === undefined}
                            onChange={event =>
                                onIsUsedForXOnyxiaValueChange?.(event.target.checked)
                            }
                            inputProps={{ "aria-label": "controlled" }}
                        />
                    </div>
                    <div className={classes.line}>
                        <Text typo="label 1">{t("use for onyxia explorers")}</Text>
                        <Tooltip title={t("use for onyxia explorers helper")}>
                            <Icon
                                className={classes.helpIcon}
                                icon={id<MuiIconComponentName>("Help")}
                            />
                        </Tooltip>
                        &nbsp;
                        <Switch
                            checked={isUsedForExplorer}
                            disabled={onIsUsedForExplorerValueChange === undefined}
                            onChange={event =>
                                onIsUsedForExplorerValueChange?.(event.target.checked)
                            }
                            inputProps={{ "aria-label": "controlled" }}
                        />
                    </div>
                </>
            )}
            <div
                className={css({
                    "marginTop": theme.spacing(4),
                    "display": "flex"
                })}
            >
                {connectionTestStatus !== undefined && (
                    <TestS3ConnectionButton
                        className={css({})}
                        connectionTestStatus={connectionTestStatus}
                        onTestConnection={onTestConnection}
                    />
                )}
                <div className={css({ "flex": 1 })} />
                <div
                    className={css({
                        "display": "flex",
                        "gap": theme.spacing(2)
                    })}
                >
                    {onEdit !== undefined && (
                        <Button
                            variant="secondary"
                            startIcon={id<MuiIconComponentName>("Edit")}
                            onClick={() => onEdit()}
                        >
                            {t("edit")}
                        </Button>
                    )}
                    {onDelete !== undefined && (
                        <Button
                            variant="secondary"
                            startIcon={id<MuiIconComponentName>("Delete")}
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
    "root": {
        "padding": theme.spacing(3),
        "borderRadius": theme.spacing(2),
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "boxShadow": theme.shadows[3],
        "&:hover": {
            "boxShadow": theme.shadows[6]
        }
    },
    "line": {
        "marginBottom": theme.spacing(3),
        "display": "flex",
        "alignItems": "center"
    },
    "helpIcon": {
        "marginLeft": theme.spacing(2),
        "fontSize": "inherit",
        ...(() => {
            const factor = 1.1;
            return { "width": `${factor}em`, "height": `${factor}em` };
        })()
    }
}));

export const { i18n } = declareComponentKeys<
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
