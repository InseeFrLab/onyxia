

import { useMemo, useCallback } from "react";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { withProps } from "app/utils/withProps";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { MySecretsEditorRow, Props as RowProps } from "./MySecretsEditorRow";
import { useArrayDiff } from "app/utils/hooks/useArrayDiff";
import { Button } from "app/components/designSystem/Button";
import { generateUniqDefaultName, buildNameFactory } from "app/utils/generateUniqDefaultName";
import { Paper } from "app/components/designSystem/Paper";
import {
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableBody,
    TableFooter
} from "app/components/designSystem/Table";
import { Tooltip } from "app/components/designSystem/Tooltip";
import { id } from "evt/tools/typeSafety/id";

export type Props = {
    isBeingUpdated: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
};

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
        "watchFor": "addition",
        "array": Object.keys(secret),
        "callback": useCallback(
            ({ added }: { added: string[]; }) => {

                if (added.length > 1) {
                    return;
                }

                if (!isBeingUpdated) {
                    return;
                }
                const [key] = added;

                getEvtAction(key).post("ENTER EDITING STATE");

            },
            [isBeingUpdated, getEvtAction]
        )
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

                    if (!getIsValidKey({ "key": candidateKey })) {
                        return false;
                    }

                    if (Object.keys(secret).filter(k => k !== key).includes(candidateKey)) {
                        return false;
                    }

                    return true;

                }
        ),
        [secret]
    );

    const getResolvedValueFactory = useMemo(
        () => memoize(
            (key: string) =>
                id<RowProps["getResolvedValue"]>(({ strValue })=>{

                    if (!getIsValidKey({ key })) {
                        return { 
                            "isError": true, 
                            "errorMessage": t("invalid key")
                        };
                    }

                    if (!getIsValidStrValue({ strValue })) {

                        return { 
                            "isError": true, 
                            "errorMessage": t("invalid value")
                        };

                    }

                    let resolvedValue = strValue;

                    const keys= Object.keys(secret);

                    keys
                        .filter((()=>{

                            const iOfKey= keys.indexOf(key);

                            return (...[, i]: [any, number]) => i < iOfKey;

                        })())
                        .filter(key => getIsValidKey({ key }))
                        .filter(key => getIsValidStrValue({ "strValue": stringifyValue(secret[key]) }))
                        .forEach(key => resolvedValue = resolvedValue.replace(
                            new RegExp(`\\$${key}(?=[". $])`, "g"),
                            stringifyValue(secret[key])
                        ));

                    resolvedValue = resolvedValue.replace(/"/g, "");

                    return { 
                        "isError": false, 
                        "resolvedValue": resolvedValue === strValue ? "" : resolvedValue  
                    };

                })
        ),
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

    return (
        <TableContainer component={withProps(Paper, { "elevation": 3 })}>
            <Table aria-label={t("table of secret")}>
                <TableHead>
                    <TableRow>
                        <TableCell>$</TableCell>
                        <TableCell>{t("key label")}</TableCell>
                        <TableCell>{t("value label")}</TableCell>
                        <TableCell>
                            <Tooltip title={t("what's a resolved value")} >
                                <>{t("resolved value label")}</>
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.keys(secret).map(key =>
                        <Row
                            key={key}
                            keyOfSecret={key}
                            strValue={stringifyValue(secret[key])}
                            isLocked={isBeingUpdated}
                            onEdit={onEditFactory(key)}
                            onDelete={onDeleteFactory(key)}
                            getResolvedValue={getResolvedValueFactory(key)}
                            getIsValidAndAvailableKey={getIsValidAndAvailableKeyFactory(key)}
                            evtAction={getEvtAction(key)}
                        />
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell align="left">
                            <Button
                                icon="add"
                                onClick={onClick}
                            >
                                {t("add an entry")}
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );

}

export declare namespace MySecretsEditor {

    export type I18nScheme = {
        'invalid value': undefined;
        'invalid key': undefined;
        'add an entry': undefined;
        'environnement variable default name': undefined;
        'table of secret': undefined;
        'key label': undefined;
        'value label': undefined;
        'resolved value label': undefined;
        'what\'s a resolved value': undefined;
    };

}


function stringifyValue(value: Secret.Value) {
    return typeof value === "object" ?
        JSON.stringify(value) :
        `${value}`
        ;
}

/** Exported for storybook */
export const getIsValidStrValue: RowProps["getIsValidStrValue"] =
    ({ strValue }) => {

        // We want an even number of unescaped double quote (")
        if ((strValue.match(/(?<!\\)"/g)?.length ?? 0) % 2 === 1) {
            return false;
        }

        return true;

    };

/** Exported for storybook */
export function getIsValidKey(params: { key: string; }): boolean {

    const { key } = params;

    if (key !== key.toUpperCase()) {
        return false;
    }

    if (!/^[a-z_]/.test(key.toLowerCase())) {
        return false;
    }

    return true;

}

const Row = withProps(
    MySecretsEditorRow,
    { getIsValidStrValue }
);
