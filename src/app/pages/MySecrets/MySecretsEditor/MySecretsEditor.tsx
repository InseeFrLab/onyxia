import React from "react";
import { useMemo, useCallback } from "react";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { MySecretsEditorRow, Props as RowProps } from "./MySecretsEditorRow";
import { useArrayDiff } from "app/utils/hooks/useArrayDiff";
import type { UseArrayDiffCallbackParams } from "app/utils/hooks/useArrayDiff";
import { Button } from "app/components/designSystem/Button";
import { Typography } from "app/components/designSystem/Typography";
import { useTheme } from "@material-ui/core/styles";
import { generateUniqDefaultName, buildNameFactory } from "app/utils/generateUniqDefaultName";
import { Paper } from "app/components/designSystem/Paper";
import {
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableBody,
    //TableFooter
} from "app/components/designSystem/Table";
import { Tooltip } from "app/components/designSystem/Tooltip";
import { id } from "evt/tools/typeSafety/id";
import type { Id } from "evt/tools/typeSafety/id";
import { evaluateShellExpression } from "app/utils/evaluateShellExpression";
import { makeStyles, createStyles } from "@material-ui/core/styles";

export type Props = {
    isBeingUpdated: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
};

const useStyles = makeStyles(
    theme => createStyles<"root" | "tableContainer" | "tableHead", Props>({
        "root": {
            "padding": theme.spacing(2), 
        },
        "tableContainer": {
            //So the error on the input of the last row is not cropped.
            "overflow": "visible"
        },
        "tableHead": {
            "& .MuiTypography-root": {
                "padding": theme.spacing(2, 1)
            }
        }
    })
);

export function MySecretsEditor(props: Props) {

    const { secretWithMetadata, onEdit, isBeingUpdated } = props;

    const { secret } = secretWithMetadata;

    const { t } = useTranslation("MySecretsEditor");

    const getEvtAction = useMemo(
        () => memoize(
            (_key: string) => Evt.create<UnpackEvt<RowProps["evtAction"]>>()
        ),
        []
    );

    // When an row is created automatically enter editing mode.
    useArrayDiff({
        "watchFor": "addition or deletion",
        "array": Object.keys(secret),
        "callback": useCallback(({ added, removed }: UseArrayDiffCallbackParams<string>) => {

            if (!(
                added.length === 1 &&
                removed.length === 0
            )) {
                return;
            }

            const [key] = added;

            getEvtAction(key).post("ENTER EDITING STATE");

        }, [getEvtAction])
    });

    const onEditFactory = useMemo(
        () => memoize(
            (key: string) =>
                ({ editedKey, editedStrValue }: Parameters<RowProps["onEdit"]>[0]) =>
                    onEdit((() => {

                        if (
                            editedKey !== undefined &&
                            editedStrValue !== undefined
                        ) {
                            return {
                                "action": "renameKeyAndUpdateValue" as const,
                                key,
                                "newKey": editedKey,
                                "newValue": editedStrValue
                            };
                        }

                        if (editedStrValue !== undefined) {

                            return {
                                "action": "addOrOverwriteKeyValue" as const,
                                key,
                                "value": editedStrValue
                            };

                        }

                        if (editedKey !== undefined) {

                            return {
                                "action": "renameKey" as const,
                                key,
                                "newKey": editedKey
                            };

                        }

                        assert(false);

                    })())
        ),
        [onEdit]
    );

    const onDeleteFactory = useMemo(
        () => memoize(
            (key: string) =>
                () => onEdit({
                    "action": "removeKeyValue",
                    key
                })
        ),
        [onEdit]
    );

    const getIsValidAndAvailableKeyFactory = useMemo(
        () => memoize(
            (key: string) =>
                ({ key: candidateKey }: Parameters<RowProps["getIsValidAndAvailableKey"]>[0]) => {

                    {

                        const getIsValidKeyResult = getIsValidKey({ "key": candidateKey });

                        if (!getIsValidKeyResult.isValidKey) {
                            return {
                                "isValidAndAvailableKey": false,
                                "message": t(getIsValidKeyResult.message)
                            } as const;
                        }

                    }

                    if (Object.keys(secret).filter(k => k !== key).includes(candidateKey)) {

                        return {
                            "isValidAndAvailableKey": false,
                            "message": t("unavailable key")
                        } as const;
                    }

                    return { "isValidAndAvailableKey": true } as const;

                }
        ),
        [secret, t]
    );

    const getResolvedValueFactory = useMemo(
        () => {

            const secretKeys = Object.keys(secret);

            /** Can throw */
            const getResolvedValue = memoize(
                (key: string, strValue: string): undefined | string => {

                    const indexOfKey = secretKeys.indexOf(key);

                    return evaluateShellExpression({
                        "expression": strValue,
                        "getEnvValue": ({ envName: keyBis }) => {

                            const indexOfKeyBis = secretKeys.indexOf(keyBis);

                            if ( indexOfKeyBis === -1 || !(indexOfKeyBis < indexOfKey)) {
                                return undefined;
                            }

                            return getResolvedValue(
                                keyBis,
                                stringifyValue(secret[keyBis])
                            );

                        }
                    });

                }
            );

            return memoize(
                (key: string) =>
                    id<RowProps["getResolvedValue"]>(
                        ({ strValue }) => {

                            const resolvedValue = getResolvedValue(key, strValue);

                            return resolvedValue === undefined ?
                                {
                                    "isResolvedSuccessfully": false,
                                    "message": t("invalid value cannot eval")
                                } as const :
                                {
                                    "isResolvedSuccessfully": true,
                                    "resolvedValue": resolvedValue === strValue.replace(/ +$/,"") ?
                                        "" : resolvedValue
                                } as const;

                        }
                    )
            );

        },
        [secret, t]
    );



    const onClick = useCallback(() =>
        onEdit({
            "action": "addOrOverwriteKeyValue",
            "key": generateUniqDefaultName({
                "names": Object.keys(secret),
                "buildName": buildNameFactory({
                    "defaultName": t("environnement variable default name"),
                    "separator": "_"
                })
            }),
            "value": ""
        }),
        [secret, onEdit, t]
    );

    const theme = useTheme();

    const classes = useStyles(props);

    return (
        <Paper className={classes.root}>
            <TableContainer className={classes.tableContainer}>
                <Table aria-label={t("table of secret")}>
                    <TableHead className={classes.tableHead}>
                        <TableRow>
                            <TableCell>
                                <Typography
                                    variant="body1"
                                >
                                    $
                                </Typography>

                            </TableCell>
                            <TableCell>
                                <Typography
                                    variant="body1"
                                >
                                    {t("key column name")}
                                </Typography>

                            </TableCell>

                            <TableCell>
                                <Typography
                                    variant="body1"
                                >
                                    {t("value column name")}
                                </Typography>

                            </TableCell>


                            <TableCell>
                                <Tooltip title={t("what's a resolved value")} >
                                    <Typography
                                        variant="body1"
                                        style={{ 
                                            //So that the tooltip is well positioned
                                            "display": "inline-block" 
                                        }}
                                    >
                                        {t("resolved value column name")}
                                    </Typography>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.keys(secret).map((key, i) =>
                            <MySecretsEditorRow
                                key={key}
                                keyOfSecret={key}
                                strValue={stringifyValue(secret[key])}
                                isLocked={isBeingUpdated}
                                onEdit={onEditFactory(key)}
                                onDelete={onDeleteFactory(key)}
                                getResolvedValue={getResolvedValueFactory(key)}
                                getIsValidAndAvailableKey={getIsValidAndAvailableKeyFactory(key)}
                                evtAction={getEvtAction(key)}
                                isDarker={i % 2 === 1}
                            />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button
                startIcon="add"
                onClick={onClick}
                style={{ "marginTop": theme.spacing(3) }}
            >
                {t("add an entry")}
            </Button>
        </Paper>
    );

}

export declare namespace MySecretsEditor {

    export type I18nScheme = {
        'add an entry': undefined;
        'environnement variable default name': undefined;
        'table of secret': undefined;
        'key column name': undefined;
        'value column name': undefined;
        'resolved value column name': undefined;
        'what\'s a resolved value': undefined;

        'unavailable key': undefined;
        'invalid key empty string': undefined;
        'invalid key _ not valid': undefined;
        'invalid key start with digit': undefined;
        'invalid key invalid character': undefined;

        'invalid value cannot eval': undefined;


    };

}

function stringifyValue(value: Secret.Value) {
    return typeof value === "object" ?
        JSON.stringify(value) :
        `${value}`
        ;
}

//const TableContainerComponent = withProps(Paper, { "elevation": 3 });

/** Exported for storybook */
export function getIsValidKey(params: { key: string; }): {
    isValidKey: true;
} | {
    isValidKey: false;
    message: Id<
        keyof MySecretsEditor.I18nScheme,
        'invalid key _ not valid' |
        'invalid key start with digit' |
        'invalid key invalid character' |
        'invalid key empty string'
    >;
} {

    const { key } = params;

    if (key === "") {
        return {
            "isValidKey": false,
            "message": "invalid key empty string"
        };
    }

    if (key === "_") {
        return {
            "isValidKey": false,
            "message": "invalid key _ not valid"
        };
    }

    if (/^[0-9]/.test(key)) {
        return {
            "isValidKey": false,
            "message": "invalid key start with digit"
        };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        return {
            "isValidKey": false,
            "message": "invalid key invalid character"
        };
    }

    return { "isValidKey": true };

}




