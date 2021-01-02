

import { useMemo, useCallback } from "react";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import { withProps } from "app/utils/withProps";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";
import { MySecretEditorRow, Props as RowProps } from "./MySecretsEditorRows";
import { useArrayDiff } from "app/utils/hooks/useArrayDiff";
import { Button } from "app/components/designSystem/Button";
import { generateUniqDefaultName, buildNameFactory } from "app/utils/generateUniqDefaultName";
import { Paper } from "app/components/designSystem/Paper";

export type Props = {
    isBeingUpdated: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
};


function stringifyValue(value: Secret.Value) {
    return typeof value === "object" ?
        JSON.stringify(value) :
        `${value}`
        ;
}

const getIsValidStrValue: RowProps["getIsValidStrValue"] =
    ({ strValue }) => {

        // We want an even number of unescaped double quote (")
        if ((strValue.match(/(?<!\\)"/g)?.length ?? 0) % 2 === 1) {
            return false;
        }

        return true;

    };

function getIsValidKey(params: { key: string; }): boolean {

    const { key } = params;

    if (key !== key.toLowerCase()) {
        return false;
    }

    if (!/^[a-z_]/.test(key)) {
        return false;
    }

    return true;

}

const Row = withProps(
    MySecretEditorRow,
    { getIsValidStrValue }
)

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
                ({ strValue }: Parameters<RowProps["getResolvedValue"]>[0]) => {

                    if (!getIsValidKey({ key })) {
                        return t("invalid key");
                    }

                    if (!getIsValidStrValue({ strValue })) {
                        return t("invalid value");
                    }

                    let resolvedValue = strValue;

                    Object.keys(secret)
                        .filter(k => k !== key)
                        .filter(key => getIsValidKey({ key }))
                        .filter(key => getIsValidStrValue({ "strValue": stringifyValue(secret[key]) }))
                        .forEach(key => resolvedValue = resolvedValue.replace(
                            new RegExp(`\\$${key}(?=[". $])`, "g"),
                            stringifyValue(secret[key])
                        ));

                    return resolvedValue.replace(/"/g, "");

                }
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
        <Paper>
            {
                Object.keys(secret).map(key => {

                    const strValue = stringifyValue(secret[key]);

                    return (
                        <Row
                            key={key}
                            keyOfSecret={key}
                            value={strValue}
                            isLocked={isBeingUpdated}
                            onEdit={onEditFactory(key)}
                            onDelete={onDeleteFactory(key)}
                            getResolvedValue={getResolvedValueFactory(key)}
                            getIsValidAndAvailableKey={getIsValidAndAvailableKeyFactory(key)}
                            evtAction={getEvtAction(key)}
                        />
                    );

                })
            }
            <Button
                icon="lab"
                onClick={onClick}
            >{t("add an entry")}
            </Button>
        </Paper>
    );

}

export declare namespace MySecretsEditor {

    export type I18nScheme = {
        'invalid value': undefined;
        'invalid key': undefined;
        'add an entry': undefined;
        'environnement variable default name': undefined;
    };

}

