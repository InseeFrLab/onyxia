

import { useMemo, useState } from "react";
import type { SecretWithMetadata, Secret } from "lib/ports/SecretsManagerClient";
import type { NonPostableEvt } from "evt";
import { getKeyPropFactory } from "app/utils/getKeyProp";
import { withProps } from "app/utils/withProps";
import memoize from "memoizee";
import { useTranslation } from "app/i18n/useTranslations";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

export type Props = {

    isBeingEdited: boolean;
    secretWithMetadata: SecretWithMetadata;
    onEdit(params: {
        secretKey: string;
        secretStringifiedValue: string;
        editedSecretKey: string | undefined;
        editedSecretStringifiedValue: string | undefined;
    }): void;
    onDelete(params: {
        secretKey: string;
    }): void;
};

function stringifySecretValue(secretValue: Secret.Value) {
    return typeof secretValue === "object" ?
        JSON.stringify(secretValue) :
        `${secretValue}`
        ;
}

const getIsValidSecretStringifiedValue: MySecretsEditorRowProps["getIsValidSecretStringifiedValue"] =
    ({ secretStringifiedValue }) => {

        // We want an even number of unescaped double quote (")
        if (
            (secretStringifiedValue.match(/(?<!\\)"/g)?.length ?? 0) % 2 === 1
        ) {
            return false;
        }

        return true;

    }

function getIsValidSecretKey(params: { secretKey: string; }): boolean {

    const { secretKey } = params;

    if (secretKey !== secretKey.toLowerCase()) {
        return false;
    }

    if (!/^[a-z_]/.test(secretKey)) {
        return false;
    }

    return true;

}

const Row = withProps(
    MySecretEditorRow,
    { getIsValidSecretStringifiedValue }
)

export function MySecretsEditor(props: Props) {

    const { secretWithMetadata, onEdit, onDelete } = props;

    const { secret } = secretWithMetadata;

    const { t } = useTranslation("MySecretsEditor");

    const [{
        getKeyProp,
        transfersKeyProp
    }] = useState(
        () => getKeyPropFactory<{
            secretKey: string;
            secretStringifiedValue: string;
        }>()
    );



    const onEditFactory = useMemo(
        () => memoize(
            (secretKey: string, secretStringifiedValue: string) =>
                ({ editedSecretKey, editedSecretStringifiedValue }: Parameters<MySecretsEditorRowProps["onEdit"]>[0]) => {

                    transfersKeyProp({
                        "toValues": {
                            "secretKey":
                                editedSecretKey ?? secretKey,
                            "secretStringifiedValue":
                                secretStringifiedValue ?? editedSecretStringifiedValue
                        },
                        "fromValues": {
                            secretKey,
                            secretStringifiedValue,
                        }
                    });

                    onEdit({
                        secretKey,
                        secretStringifiedValue,
                        editedSecretKey,
                        editedSecretStringifiedValue
                    });

                }
        ),
        [onEdit, transfersKeyProp]
    );

    const onDeleteFactory = useMemo(
        () => memoize(
            (secretKey: string) =>
                () =>
                    onDelete({ secretKey })
        ),
        [onDelete]
    );

    const getIsValidAndAvailableSecretKeyFactory = useMemo(
        () => memoize(
            (secretKey: string) =>
                ({ editedSecretKey }: Parameters<MySecretsEditorRowProps["getIsValidAndAvailableSecretKey"]>[0]) => {

                    if( !getIsValidSecretKey({ "secretKey": editedSecretKey }) ){
                        return false;
                    }

                    if (Object.keys(secret).filter(k => k !== secretKey).includes(editedSecretKey)) {
                        return false;
                    }

                    return true;

                }
        ),
        [secret]
    );

    const getResolvedValueFactory = useMemo(
        () => memoize(
            (secretKey: string) =>
                ({ secretStringifiedValue }: Parameters<MySecretsEditorRowProps["getResolvedValue"]>[0]) => {

                    if (!getIsValidSecretKey({ secretKey })) {
                        return t("invalid key");
                    }

                    if (!getIsValidSecretStringifiedValue({ secretStringifiedValue })) {
                        return t("invalid value");
                    }

                    let resolvedValue = secretStringifiedValue;

                    Object.keys(secret)
                        .filter(k => k !== secretKey)
                        .filter(secretKey => getIsValidSecretKey({ secretKey }))
                        .filter(secretKey => getIsValidSecretStringifiedValue(
                            { "secretStringifiedValue": stringifySecretValue(secret[secretKey]) }
                        ))
                        .forEach(secretKey =>
                            resolvedValue = resolvedValue.replace(
                                new RegExp(`\\$${secretKey}(?=[". $])`, "g"),
                                stringifySecretValue(secret[secretKey])
                            )
                        );

                    return resolvedValue.replace(/"/g, "")

                }
        ),
        [secret, t]
    );

    const getEvtAction = useMemo(
        () => memoize(
            (_keyProp: string) => Evt.create<UnpackEvt<MySecretsEditorRowProps["evtAction"]>>()
        ),
        []
    );

    return Object.keys(secret).map(secretKey => {

        const secretStringifiedValue = stringifySecretValue(secret[secretKey]);

        const keyProp = getKeyProp({ secretKey, secretStringifiedValue });

        return (
            <Row
                key={keyProp}
                secretKey={secretKey}
                secretStringifiedValue={secretStringifiedValue}
                onEdit={onEditFactory(secretKey, secretStringifiedValue)}
                onDelete={onDeleteFactory(secretKey)}
                getResolvedValue={getResolvedValueFactory(secretKey)}
                getIsValidAndAvailableSecretKey={getIsValidAndAvailableSecretKeyFactory(secretKey)}
                evtAction={getEvtAction(keyProp)}
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
    getIsValidSecretStringifiedValue(params: { secretStringifiedValue: string; }): boolean;

    secretKey: string;
    secretStringifiedValue: string;
    isCircularProgressShown: boolean;
    onEdit(params: {
        editedSecretKey: string | undefined;
        editedSecretStringifiedValue: string | undefined;
    }): void;
    onDelete(): void;
    getResolvedValue(params: { secretStringifiedValue: string; }): string;
    getIsValidAndAvailableSecretKey(params: { editedSecretKey: string; }): boolean;


    evtAction: NonPostableEvt<"ENTER EDITING STATE">;
};

function MySecretEditorRow(props: MySecretsEditorRowProps) {

    return null;
}