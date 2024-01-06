import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Button } from "onyxia-ui/Button";

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
        doHideUsageSwitches
    } = props;

    return (
        <div className={className}>
            <div style={{ "display": "flex" }}>
                <Text typo="label 1">Data Source:</Text>
                &nbsp;
                <Text typo="body 1">{dataSource}</Text>
            </div>
            {region !== "" && (
                <div style={{ "display": "flex" }}>
                    <Text typo="label 1">Region:</Text>
                    &nbsp;
                    <Text typo="body 1">{region}</Text>
                </div>
            )}
            {accountFriendlyName === undefined ? (
                <div style={{ "display": "flex" }}>
                    <Text typo="label 1">Credentials:</Text>
                    &nbsp;
                    <Text typo="body 1">Tokens automatically generated (STS)</Text>
                </div>
            ) : (
                <>
                    <div style={{ "display": "flex" }}>
                        <Text typo="label 1">Account:</Text>
                        &nbsp;
                        <Text typo="body 1">{accountFriendlyName}</Text>
                    </div>
                </>
            )}
            {!doHideUsageSwitches && (
                <>
                    <div style={{ "display": "flex" }}>
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
                    <div style={{ "display": "flex" }}>
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
        </div>
    );
}
