import { createUseClassNames, css, cx, useTheme } from "app/theme/useClassNames";
import { useMemo, useState, memo } from "react";
import type { NonPostableEvt } from "evt";
import { TextField } from "app/components/designSystem/textField/TextField";
import type { TextFieldProps } from "app/components/designSystem/textField/TextField";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import type { UnpackEvt } from "evt";
import { useTranslation } from "app/i18n/useTranslations";
import { smartTrim } from "app/utils/smartTrim";
import { Typography } from "app/components/designSystem/Typography";
import { IconButton } from "app/components/designSystem/IconButton";
import { useCallbackFactory, useCallback } from "app/utils/hooks/useCallbackFactory";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";


export type Props = {

    isLocked: boolean;

    /** NOTE: We can't use "key" as it's a reserved props*/
    keyOfSecret: string;
    strValue: string;
    onEdit(params: {
        editedKey: string | undefined;
        editedStrValue: string | undefined;
    }): void;
    onDelete(): void;
    getResolvedValue(params: { strValue: string; }): {
        isResolvedSuccessfully: true;
        resolvedValue: string;
    } | {
        isResolvedSuccessfully: false;
        message: string;
    };
    getIsValidAndAvailableKey(params: { key: string; }): {
        isValidAndAvailableKey: true;
    } | {
        isValidAndAvailableKey: false;
        message: string;
    };

    evtAction: NonPostableEvt<"ENTER EDITING STATE">;

    isDarker: boolean;

};

const { useClassNames } = createUseClassNames<Props & { isInEditingState: boolean; }>()(
    ({ theme }, { isInEditingState, isDarker }) => ({
        "root": {
            "backgroundColor": isDarker ?
                theme.custom.colors.useCases.surfaces.background :
                "transparent",
        },
        "dollarSign": {
            "color": isInEditingState ?
                theme.custom.colors.useCases.typography.textDisabled :
                theme.custom.colors.useCases.typography.textFocus
        },
        "valueAndResolvedValue": {
            "padding": theme.spacing(2, 1),
            "wordBreak": "break-all"
        },
        "keyAndValueTableCells": {
            "padding": isInEditingState ? theme.spacing(0, 2) : undefined
        }
    })
);

export const MySecretsEditorRow = memo((props: Props) => {

    const { t } = useTranslation("MySecretsEditorRow");

    const {
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
        () => Evt.create<UnpackEvt<TextFieldProps["evtAction"]>>()
    );

    const [evtEdited] = useState(() => Evt.create<{ editedKey?: string; editedStrValue?: string; }>({}));

    const onSubmitFactory = useCallbackFactory(
        ([inputTarget]: [keyof UnpackEvt<typeof evtEdited>], [{ value }]: [Parameters<TextFieldProps["onSubmit"]>[0]]) =>
            evtEdited.state = { ...evtEdited.state, [inputTarget]: value },
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
        () => {
            evtInputAction.post("TRIGGER SUBMIT");
            setIsInEditingState(false);
        },
        [evtInputAction]
    );

    const onEscapeKeyDown = useCallback(
        () => evtInputAction.post("RESTORE DEFAULT VALUE"),
        [evtInputAction]
    );

    const onEnterKeyDown = isSubmitButtonDisabled ? undefined : onSubmitButtonClick;



    const [strValueBeingTyped, setStrValueBeingTyped] = useState("");

    const onValueBeingTypedChange_key = useCallback(
        ({ isValidValue }: Parameters<NonNullable<TextFieldProps["onValueBeingTypedChange"]>>[0]) =>
            setIsValidKey(isValidValue),
        []
    );

    const onValueBeingTypedChange_strValue = useCallback(
        ({ isValidValue, value }: Parameters<NonNullable<TextFieldProps["onValueBeingTypedChange"]>>[0]) => {

            setIsValidStrValue(isValidValue);

            setStrValueBeingTyped(value);

        },
        []
    );

    const onEditButtonClick = useCallback(
        () => setIsInEditingState(true),
        []
    );

    //NOTE: We don't want to use useMemo here because the resolved values depends on other keys.
    const resolveValueResult = getResolvedValue(
        { "strValue": isInEditingState ? strValueBeingTyped : strValue }
    );

    const getIsValidValue_key = useCallback(
        (value: Parameters<TextFieldProps["getIsValidValue"]>[0]) => {

            const result = getIsValidAndAvailableKey({ "key": value });

            return result.isValidAndAvailableKey ?
                { "isValidValue": true } as const :
                { "isValidValue": false, "message": result.message } as const;

        },
        [getIsValidAndAvailableKey]
    );

    const getIsValidValue_strValue = useCallback(
        (value: Parameters<TextFieldProps["getIsValidValue"]>[0]) => {

            const resolveValueResult = getResolvedValue({ "strValue": value });

            return resolveValueResult.isResolvedSuccessfully ?
                { "isValidValue": true } as const :
                { "isValidValue": false, "message": resolveValueResult.message } as const;

        },
        [getResolvedValue]
    );

    const { classNames } = useClassNames({ ...props, isInEditingState });

    const SmartTrim = useMemo(
        () =>
            (props: {
                className: string;
                children: string;
            }) => {

                const { children, className } = props;

                return (
                    <Typography className={className}>{
                        smartTrim({
                            "maxLength": 70,
                            "minCharAtTheEnd": 10,
                            "text": children
                        })
                    }</Typography>
                );

            },
        []
    );

    const theme = useTheme();

    return (
        <TableRow className={classNames.root}>
            <TableCell>
                <Typography
                    variant="body1"
                    className={cx(
                        classNames.dollarSign,
                        css({ "padding": theme.spacing(2, 1) })
                    )}
                >
                    $
                </Typography>
            </TableCell>
            <TableCell className={classNames.keyAndValueTableCells}>
                {
                    !isInEditingState ?
                        <Typography
                            variant="body1"
                            className={css({ "padding": theme.spacing(2, 1) })}
                        >
                            {key}
                        </Typography>
                        :
                        <TextField
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
            <TableCell className={classNames.keyAndValueTableCells}>{
                !isInEditingState ?
                    <SmartTrim className={classNames.valueAndResolvedValue}>
                        {strValue}
                    </SmartTrim>
                    :
                    <TextField
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
                !resolveValueResult.isResolvedSuccessfully ?
                    null :
                    <SmartTrim
                        className={cx(
                            classNames.valueAndResolvedValue,
                            css({ "color": theme.custom.colors.palette.whiteSnow.greyVariant3 })
                        )}
                    >
                        {resolveValueResult.resolvedValue}
                    </SmartTrim>

            }</TableCell>
            <TableCell align="right">
                <div className={css({ "display": "flex" })}>
                    <IconButton
                        type={isInEditingState ? "check" : "edit"}
                        disabled={isInEditingState ? isSubmitButtonDisabled : isLocked}
                        onClick={isInEditingState ? onSubmitButtonClick : onEditButtonClick}
                        fontSize="small"
                    />
                    <IconButton
                        disabled={isLocked}
                        type="delete"
                        onClick={onDelete}
                        fontSize="small"
                    />
                </div>
            </TableCell>
        </TableRow>
    );

});

export declare namespace MySecretsEditorRow {

    export type I18nScheme = {
        'key input desc': undefined;
        'value input desc': undefined;
    };

}

function toUpperCase(value: string) {
    return value.toUpperCase();
}
