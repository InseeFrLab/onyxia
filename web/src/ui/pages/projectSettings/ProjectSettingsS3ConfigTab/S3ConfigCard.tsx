import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";
import type { ConnectionTestStatus } from "core/usecases/s3ConfigManagement";
import { TestS3ConnectionButton } from "./TestS3ConnectionButton";

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

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.line}>
                <Text typo="label 1">Data Source:</Text>
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
                        <Text typo="label 1">Credentials:</Text>
                        &nbsp; &nbsp;
                        <Text typo="body 1">
                            Tokens dynamically requested on your behalf by Onyxia (STS)
                        </Text>
                    </>
                ) : (
                    <>
                        <Text typo="label 1">Account:</Text>
                        &nbsp; &nbsp;
                        <Text typo="body 1">{accountFriendlyName}</Text>
                    </>
                )}
            </div>
            {!doHideUsageSwitches && (
                <>
                    <div className={classes.line}>
                        <Text typo="label 1">Use in services:</Text>
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
                        <Text typo="label 1">Use for Onyxia explorer:</Text>
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
                            Edit
                        </Button>
                    )}
                    {onDelete !== undefined && (
                        <Button
                            variant="secondary"
                            startIcon={id<MuiIconComponentName>("Delete")}
                            onClick={() => onDelete()}
                        >
                            Delete
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
        "backgroundColor": theme.colors.useCases.surfaces.surface2,
        "boxShadow": theme.shadows[1],
        "&:hover": {
            "boxShadow": theme.shadows[6]
        }
    },
    "line": {
        "marginBottom": theme.spacing(3),
        "display": "flex",
        "alignItems": "center"
    }
}));
