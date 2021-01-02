

import { useMemo } from "react";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { EditSecretParams } from "lib/useCases/secretExplorer";
import type { NonPostableEvt } from "evt";
import { withProps } from "app/utils/withProps";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { assert } from "evt/tools/typeSafety/assert";

export type Props = {
    isBeingEdited: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: EditSecretParams): void;
};


function stringifyValue(value: Secret.Value) {
    return typeof value === "object" ?
        JSON.stringify(value) :
        `${value}`
        ;
}

const getIsValidStrValue: MySecretsEditorRowProps["getIsValidStrValue"] =
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

    const { secretWithMetadata, onEdit, isBeingEdited } = props;

    const { secret } = secretWithMetadata;

    const { t } = useTranslation("MySecretsEditor");

    const onEditFactory = useMemo(
        () => memoize(
            (key: string) =>
                ({ editedKey, editedStrValue }: Parameters<MySecretsEditorRowProps["onEdit"]>[0]) =>
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
                ({ key: candidateKey }: Parameters<MySecretsEditorRowProps["getIsValidAndAvailableKey"]>[0]) => {

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
                ({ strValue }: Parameters<MySecretsEditorRowProps["getResolvedValue"]>[0]) => {

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

    const getEvtAction = useMemo(
        () => memoize(
            (_key: string) => Evt.create<UnpackEvt<MySecretsEditorRowProps["evtAction"]>>()
        ),
        []
    );

    return Object.keys(secret).map(key => {

        const strValue = stringifyValue(secret[key]);

        return (
            <Row
                key={key}
                keyOfSecret={key}
                value={strValue}
                isLocked={isBeingEdited}
                onEdit={onEditFactory(key)}
                onDelete={onDeleteFactory(key)}
                getResolvedValue={getResolvedValueFactory(key)}
                getIsValidAndAvailableKey={getIsValidAndAvailableKeyFactory(key)}
                evtAction={getEvtAction(key)}
            />
        );

    });

}

export declare namespace MySecretsEditor {

    export type I18nScheme = {
        'invalid value': undefined;
        'invalid key': undefined;
    };

}


type MySecretsEditorRowProps = {

    /** [HIGHER ORDER] */
    getIsValidStrValue(params: { strValue: string; }): boolean;

    isLocked: boolean;

    keyOfSecret: string;
    value: string;
    onEdit(params: {
        editedKey: string | undefined;
        editedStrValue: string | undefined;
    }): void;
    onDelete(): void;
    getResolvedValue(params: { strValue: string; }): string;
    getIsValidAndAvailableKey(params: { key: string; }): boolean;

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;
};

function MySecretEditorRow(props: MySecretsEditorRowProps) {

    return null;
}