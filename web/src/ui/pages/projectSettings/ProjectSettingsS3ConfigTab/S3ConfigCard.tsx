import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";

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
        onEdit
    } = props;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.line}>
                <Text typo="label 1">Data Source:</Text>
                &nbsp;
                <Text typo="body 1">
                    <code>{dataSource}</code>
                    {region === "" ? null : <>&nbsp;-&nbsp;{region}</>}
                </Text>
            </div>
            <div className={classes.line}>
                {accountFriendlyName === undefined ? (
                    <>
                        <Text typo="label 1">Credentials:</Text>
                        &nbsp;
                        <Text typo="body 1">
                            Tokens dynamically requested on your behalf by Onyxia (STS)
                        </Text>
                    </>
                ) : (
                    <>
                        <Text typo="label 1">Account:</Text>
                        &nbsp;
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
            {onDelete !== undefined && (
                <Button
                    startIcon={id<MuiIconComponentName>("Delete")}
                    onClick={() => onDelete()}
                >
                    Delete
                </Button>
            )}
            {onEdit !== undefined && (
                <Button
                    startIcon={id<MuiIconComponentName>("Edit")}
                    onClick={() => onEdit()}
                >
                    Edit
                </Button>
            )}
        </div>
    );
}

const useStyles = tss.withName({ S3ConfigCard }).create(({ theme }) => ({
    "root": {
        "border": `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        "padding": theme.spacing(3),
        "borderRadius": theme.spacing(2)
    },
    "line": {
        "marginBottom": theme.spacing(3),
        "display": "flex",
        "alignItems": "center"
    }
}));
