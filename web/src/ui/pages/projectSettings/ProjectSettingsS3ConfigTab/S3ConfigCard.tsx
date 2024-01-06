import { Text } from "onyxia-ui/Text";
import Switch from "@mui/material/Switch";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { Button } from "onyxia-ui/Button";

type Props = {
    className?: string;
    url: string;
    region: string;
    workingDirectoryPath: string;
    credentials:
        | {
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
          }
        | undefined;
    pathStyleAccess: boolean;
    isUsedForExplorer: boolean;
    isUsedForXOnyxia: boolean;
    onDelete: (() => void) | undefined;
    onIsUsedForExplorerValueChange: ((isUsed: boolean) => void) | undefined;
    onIsUsedForXOnyxiaValueChange: ((isUsed: boolean) => void) | undefined;
};

export function S3ConfigCard(props: Props) {
    const {
        className,
        url,
        region,
        workingDirectoryPath,
        credentials,
        pathStyleAccess,
        isUsedForExplorer,
        isUsedForXOnyxia,
        onDelete,
        onIsUsedForExplorerValueChange,
        onIsUsedForXOnyxiaValueChange
    } = props;

    return (
        <div className={className}>
            <div style={{ "display": "flex" }}>
                <Text typo="label 1">URL:</Text>
                &nbsp;
                <Text typo="body 1">{url}</Text>
            </div>
            <div style={{ "display": "flex" }}>
                <Text typo="label 1">AWS Region:</Text>
                &nbsp;
                <Text typo="body 1">{region}</Text>
            </div>
            <div style={{ "display": "flex" }}>
                <Text typo="label 1">Working directory:</Text>
                &nbsp;
                <Text typo="body 1">{workingDirectoryPath}</Text>
            </div>
            <div style={{ "display": "flex" }}>
                <Text typo="label 1">Path style access:</Text>
                &nbsp;
                <Text typo="body 1">{pathStyleAccess ? "true" : "false"}</Text>
            </div>
            {credentials === undefined ? (
                <div style={{ "display": "flex" }}>
                    <Text typo="label 1">Credentials:</Text>
                    &nbsp;
                    <Text typo="body 1">STS</Text>
                </div>
            ) : (
                <>
                    <div style={{ "display": "flex" }}>
                        <Text typo="label 1">Access Key ID:</Text>
                        &nbsp;
                        <Text typo="body 1">{credentials.accessKeyId}</Text>
                    </div>
                    <div style={{ "display": "flex" }}>
                        <Text typo="label 1">Secret Access Key:</Text>
                        &nbsp;
                        <Text typo="body 1">{credentials.secretAccessKey}</Text>
                    </div>
                    {credentials.sessionToken !== undefined && (
                        <div style={{ "display": "flex" }}>
                            <Text typo="label 1">Session Token:</Text>
                            &nbsp;
                            <Text typo="body 1">{credentials.sessionToken}</Text>
                        </div>
                    )}
                </>
            )}
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
