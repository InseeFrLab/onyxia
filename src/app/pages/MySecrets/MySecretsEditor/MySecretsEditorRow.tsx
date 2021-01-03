
import { useMemo, useState, useCallback } from "react";
import { TableCell, TableRow } from "app/components/designSystem/Table";
import type { NonPostableEvt } from "evt";
import memoize from "memoizee";
import { Input } from "app/components/designSystem/Input";
import type { InputProps } from "app/components/designSystem/Input";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import type { UnpackEvt } from "evt";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";

export type Props = {

    /** [HIGHER ORDER] */
    getIsValidStrValue(params: { strValue: string; }): boolean;

    isLocked: boolean;

    /** NOTE: We can't use "key" as it's a reserved props*/
    keyOfSecret: string;
    strValue: string;
    onEdit(params: {
        editedKey: string | undefined;
        editedStrValue: string | undefined;
    }): void;
    onDelete(): void;
    getResolvedValue(params: { strValue: string; }): string;
    getIsValidAndAvailableKey(params: { key: string; }): boolean;

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;

};

export function MySecretsEditorRow(props: Props) {

    const { t } = useTranslation("MySecretsEditorRow");

    const {
        getIsValidStrValue,
        isLocked,
        keyOfSecret: key,
        strValue,
        onEdit,
        onDelete,
        getResolvedValue,
        getIsValidAndAvailableKey,
        evtAction
    } = props;

    const [isInEditingState, setIsInEditingState] = useState(false);

    useEvt(
        ctx =>
            evtAction.attach(
                action => action === "ENTER EDITING STATE",
                ctx,
                () => setIsInEditingState(true)
            ),
        [evtAction]
    );

    const [evtInputAction] = useState(
        () => Evt.create<UnpackEvt<InputProps["evtAction"]>>()
    );

    const getIsValidValue_key = useCallback(
        (value: string) => getIsValidAndAvailableKey({ "key": value }),
        [getIsValidAndAvailableKey]
    );

    const getIsValidValue_strValue = useCallback(
        (value: string) => getIsValidStrValue({ "strValue": value }),
        [getIsValidStrValue]
    );


    const [evtEdited] = useState(() => Evt.create<{ editedKey?: string; editedStrValue?: string; }>({}));

    const onSubmitFactory = useMemo(
        () => memoize(
            (inputTarget: keyof UnpackEvt<typeof evtEdited>) =>
                ({ value }: Parameters<InputProps["onSubmit"]>[0]) =>
                    evtEdited.state = { ...evtEdited.state, [inputTarget]: value }
        ),
        [evtEdited]
    );

    useEvt(
        ctx => evtEdited.attach(
            ({ editedKey, editedStrValue }) =>
                editedKey !== undefined && editedStrValue !== undefined,
            ctx,
            ({ editedKey, editedStrValue }) => {

                evtEdited.state = {};

                setIsInEditingState(false);

                if (editedKey === key) {
                    editedKey = undefined;
                }

                if (editedStrValue === strValue) {
                    editedStrValue = undefined;
                }

                if (
                    editedKey === undefined &&
                    editedStrValue === undefined
                ) {
                    return;
                }

                onEdit({ editedKey, editedStrValue });

            }
        ),
        [evtEdited, onEdit, key, strValue]
    );

    const [isValidKey, setIsValidKey] = useState(false);
    const [isValidStrValue, setIsValidStrValue] = useState(false);

    const isSubmitButtonDisabled = isLocked || !isValidKey || !isValidStrValue;

    const onSubmitButtonClick = useCallback(
        () => evtInputAction.post("TRIGGER SUBMIT"),
        [evtInputAction]
    );

    const onEscapeKeyDown = useCallback(
        () => evtInputAction.post("RESTORE DEFAULT VALUE"),
        [evtInputAction]
    );

    const onEnterKeyDown = isSubmitButtonDisabled ? undefined : onSubmitButtonClick;

    const [strValueBeingTyped, setStrValueBeingTyped] = useState("");

    const onValueBeingTypedChange_key = useCallback(
        ({ isValidValue }: Parameters<NonNullable<InputProps["onValueBeingTypedChange"]>>[0]) =>
            setIsValidKey(isValidValue),
        []
    );

    const onValueBeingTypedChange_strValue = useCallback(
        ({ isValidValue, value }: Parameters<NonNullable<InputProps["onValueBeingTypedChange"]>>[0]) => {

            setIsValidStrValue(isValidValue);

            setStrValueBeingTyped(value);

        },
        []
    );


    return (
        <TableRow>
            <TableCell>{
                !isInEditingState ?
                    key
                    :
                    <Input
                        defaultValue={key}
                        inputProps={{ "aria-label": t("key input desc") }}
                        autoFocus={true}
                        onEscapeKeyDown={onEscapeKeyDown}
                        onEnterKeyDown={onEnterKeyDown}
                        evtAction={evtInputAction}
                        onSubmit={onSubmitFactory("editedKey")}
                        getIsValidValue={getIsValidValue_key}
                        onValueBeingTypedChange={onValueBeingTypedChange_key}
                        transformValueBeingTyped={toUpperCase}
                    />
            }</TableCell>
            <TableCell>{
                !isInEditingState ?
                    strValue
                    :
                    <Input
                        defaultValue={strValue}
                        inputProps={{ "aria-label": t("value input desc") }}
                        onEscapeKeyDown={onEscapeKeyDown}
                        onEnterKeyDown={onEnterKeyDown}
                        evtAction={evtInputAction}
                        onSubmit={onSubmitFactory("editedStrValue")}
                        getIsValidValue={getIsValidValue_strValue}
                        onValueBeingTypedChange={onValueBeingTypedChange_strValue}
                    />
            }</TableCell>
            <TableCell>{
                getResolvedValue(
                    { "strValue": isInEditingState ? strValueBeingTyped : strValue }
                )
            }</TableCell>
            <TableCell>
                <Button
                    disabled={isSubmitButtonDisabled}
                    icon="info" //TODO: Validate
                    onClick={onSubmitButtonClick}
                />
                <Button
                    disabled={isLocked}
                    icon="info" //TODO: Trash
                    onClick={onDelete}
                />
            </TableCell>
        </TableRow>
    );

}

export declare namespace MySecretsEditorRow {

    export type I18nScheme = {
        'key input desc': undefined;
        'value input desc': undefined;
    };

}

function toUpperCase(value: string){
    return value.toUpperCase();
}