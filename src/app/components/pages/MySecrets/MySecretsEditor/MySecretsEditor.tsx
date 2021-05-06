
import { createUseClassNames } from "app/theme/useClassNames";
import { css } from "tss-react";
import { useMemo, useState, memo } from "react";
import { useCallbackFactory } from "powerhooks";
import { useConstCallback } from "powerhooks";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { MySecretsEditorRow, Props as RowProps } from "./MySecretsEditorRow";
import { useArrayDiff } from "powerhooks";
import { Button } from "app/components/designSystem/Button";
import { Typography } from "app/components/designSystem/Typography";
import { generateUniqDefaultName, buildNameFactory } from "app/tools/generateUniqDefaultName";
import { Tooltip } from "app/components/designSystem/Tooltip";
import { id } from "evt/tools/typeSafety/id";
import type { Id } from "evt/tools/typeSafety/id";
import { evaluateShellExpression } from "app/tools/evaluateShellExpression";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import { Dialog } from "app/components/designSystem/Dialog";

export type Props = {
    isBeingUpdated: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
    onCopyPath(): void;
};

const { useClassNames } = createUseClassNames<Props>()(
    theme => ({
        "root": {
            "padding": theme.spacing(2),
            "& .MuiTableCell-root": {
                "padding": 0,
                "border": "unset"
            },
            "& .MuiTableHead-root": {
                "borderBottom": `1px solid ${theme.custom.colors.palette.midnightBlue.light2}`
            },
            //So the error on the input of the last row is not cropped.
            "overflow": "visible"
        },
        "tableHead": {
            "& .MuiTypography-root": {
                "padding": theme.spacing(2, 1)
            }
        },
        "buttonWrapper": {
            "& > *": {
                "marginTop": theme.spacing(3),
                "marginRight": theme.spacing(1)
            }
        },
        "tableContainerRoot": {
            "overflow": "visible"
        },
        "dialog": {
            "backgroundColor": "red"
        }
    })
);


export const MySecretsEditor = memo((props: Props) => {

    const { secretWithMetadata, onEdit, isBeingUpdated, onCopyPath } = props;

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
        "callback": ({ added, removed }) => {

            if (!(
                added.length === 1 &&
                removed.length === 0 &&
                secret[added[0]] === ""
            )) {
                return;
            }

            const [key] = added;

            getEvtAction(key).post("ENTER EDITING STATE");
        }
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

                            if (indexOfKeyBis === -1 || !(indexOfKeyBis < indexOfKey)) {
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
                                    "resolvedValue": resolvedValue === strValue.replace(/ +$/, "") ?
                                        "" : resolvedValue
                                } as const;

                        }
                    )
            );

        },
        [secret, t]
    );



    const onClick = useConstCallback(() =>
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
        })
    );

    const { classNames } = useClassNames(props);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const dialogCallbackFactory = useCallbackFactory(
        ([action]: ["open" | "close"]) => {

            const isDialogOpen = (() => {
                switch (action) {
                    case "open": return true;
                    case "close": return false;
                }
            })();

            onEditorRowStartEditFactory("")();

            if (isDialogOpen) {
                onCopyPath();
            }

            setIsDialogOpen(isDialogOpen);
        }
    );

    const onEditorRowStartEditFactory =
        useCallbackFactory(
            ([key]: [string]) =>  
                Object.keys(secret)
                    .filter(key_i => key_i !== key)
                    .map(key => getEvtAction(key).post("SUBMIT EDIT"))
        );

    return (
        <div className={classNames.root}>
            <TableContainer className={classNames.tableContainerRoot}>
                <Table aria-label={t("table of secret")}>
                    <TableHead className={classNames.tableHead}>
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
                                        className={css({
                                            //So that the tooltip is well positioned
                                            "display": "inline-block"
                                        })}
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
                                onStartEdit={onEditorRowStartEditFactory(key)}
                            />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <div className={classNames.buttonWrapper}>
                <Button
                    startIcon="add"
                    onClick={onClick}
                >
                    {t("add an entry")}
                </Button>

                <Button
                    onClick={dialogCallbackFactory("open")}
                    color="secondary"
                    startIcon="filterNone"
                >
                    {t("use this secret")}
                </Button>

                <Dialog
                    title="a"
                    subtitle="b"
                    body={t("how to use a secret")}
                    isOpen={isDialogOpen}
                    onClose={dialogCallbackFactory("close")}

                    onDoNotDisplayAgainValueChange={
                        () => {  }
                    }
                    buttons={
                        <>
                        <Button onClick={dialogCallbackFactory("close")}>
                            {t("ok")}
                        </Button>
                        </>
                    }


                />


            </div>

        </div>
    );

});
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

        'use this secret': undefined;
        'how to use a secret': undefined;
        ok: undefined;


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




