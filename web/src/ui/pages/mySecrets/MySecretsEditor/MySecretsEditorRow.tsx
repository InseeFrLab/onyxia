import { useMemo, useState, useEffect, memo } from "react";
import type { NonPostableEvt } from "evt";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { TextField } from "onyxia-ui/TextField";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import type { UnpackEvt } from "evt";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useConstCallback } from "powerhooks/useConstCallback";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import type { Parameters } from "tsafe";
import { useDomRect } from "powerhooks/useDomRect";
import type { Param0 } from "tsafe";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";

export type MySecretsEditorRowProps = {
    isLocked: boolean;

    /** NOTE: We can't use "key" as it's a reserved props*/
    keyOfSecret: string;
    strValue: string;
    onEdit: (params: {
        editedKey: string | undefined;
        editedStrValue: string | undefined;
    }) => void;
    onDelete: () => void;
    getIsValidAndAvailableKey: (params: { key: string }) =>
        | {
              isValidAndAvailableKey: true;
          }
        | {
              isValidAndAvailableKey: false;
              message: string;
          };
    onStartEdit: () => void;

    evtAction: NonPostableEvt<"ENTER EDITING STATE" | "SUBMIT EDIT">;

    isDarker: boolean;
};

export const MySecretsEditorRow = memo((props: MySecretsEditorRowProps) => {
    const { t } = useTranslation({ MySecretsEditorRow });

    const {
        isLocked,
        keyOfSecret: key,
        strValue,
        onEdit,
        onDelete,
        getIsValidAndAvailableKey,
        onStartEdit,
        evtAction
    } = props;

    const [isInEditingState, setIsInEditingState] = useState(false);

    const [isTextHidden, setIsTextHidden] = useState(true);

    useEffect(() => {
        if (!isInEditingState) {
            return;
        }

        onStartEdit();
    }, [isInEditingState, onStartEdit]);

    useEvt(
        ctx =>
            evtAction
                .pipe(ctx)
                .attach(
                    action => action === "ENTER EDITING STATE",
                    () => setIsInEditingState(true)
                )
                .attach(
                    action => action === "SUBMIT EDIT" && isInEditingState,
                    () => onSubmitButtonClick()
                ),
        [evtAction, isInEditingState]
    );

    const [evtInputAction] = useState(() =>
        Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
    );

    const [evtEdited] = useState(() =>
        Evt.create<{ editedKey?: string; editedStrValue?: string }>({})
    );

    const onSubmitFactory = useCallbackFactory(
        (
            [inputTarget]: [keyof UnpackEvt<typeof evtEdited>],
            [value]: [Param0<TextFieldProps["onSubmit"]>]
        ) => (evtEdited.state = { ...evtEdited.state, [inputTarget]: value })
    );

    useEvt(
        ctx =>
            evtEdited.attach(
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

                    if (editedKey === undefined && editedStrValue === undefined) {
                        return;
                    }

                    onEdit({ editedKey, editedStrValue });
                }
            ),
        [evtEdited, onEdit, key, strValue]
    );

    const [isValidKey, setIsValidKey] = useState(false);

    const isSubmitButtonDisabled = isLocked || !isValidKey;

    const onSubmitButtonClick = useConstCallback(() => {
        evtInputAction.post("TRIGGER SUBMIT");
        //setIsInEditingState(false);
    });

    const onEscapeKeyDown = useConstCallback(() =>
        evtInputAction.post("RESTORE DEFAULT VALUE")
    );

    const onEnterKeyDown = isSubmitButtonDisabled ? undefined : onSubmitButtonClick;

    const onValueBeingTypedChange_key = useConstCallback(
        ({
            isValidValue
        }: Parameters<NonNullable<TextFieldProps["onValueBeingTypedChange"]>>[0]) =>
            setIsValidKey(isValidValue)
    );

    const onEditButtonClick = useConstCallback(() => setIsInEditingState(true));

    const getIsValidValue_key = useConstCallback(
        (value: Parameters<NonNullable<TextFieldProps["getIsValidValue"]>>[0]) => {
            const result = getIsValidAndAvailableKey({ key: value });

            return result.isValidAndAvailableKey
                ? ({ isValidValue: true } as const)
                : ({
                      isValidValue: false,
                      message: result.message
                  } as const);
        }
    );

    const { classes, theme, css, cx } = useStyles({ ...props, isInEditingState });

    const SmartTrim = useMemo(
        () =>
            function SmartTim(props: { className: string; children: string }) {
                const { children, className } = props;

                return (
                    <Text
                        typo="body 1"
                        className={cx(
                            css({
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap"
                            }),
                            className
                        )}
                    >
                        {children}
                    </Text>
                );
            },
        []
    );

    const {
        ref,
        domRect: { width }
    } = useDomRect();

    return (
        <TableRow ref={ref} className={classes.root}>
            <TableCell>
                <Text
                    typo="body 1"
                    className={cx(
                        classes.dollarSign,
                        css({
                            padding: theme.spacing({ topBottom: 3, rightLeft: 2 })
                        })
                    )}
                >
                    $
                </Text>
            </TableCell>
            <TableCell className={classes.keyAndValueTableCells}>
                {!isInEditingState ? (
                    <Text
                        typo="body 1"
                        className={css({
                            padding: theme.spacing({ topBottom: 3, rightLeft: 2 })
                        })}
                    >
                        {key}
                    </Text>
                ) : (
                    <TextField
                        defaultValue={key}
                        inputProps_aria-label={t("key input desc")}
                        inputProps_autoFocus={true}
                        onEscapeKeyDown={onEscapeKeyDown}
                        onEnterKeyDown={onEnterKeyDown}
                        evtAction={evtInputAction}
                        onSubmit={onSubmitFactory("editedKey")}
                        getIsValidValue={getIsValidValue_key}
                        onValueBeingTypedChange={onValueBeingTypedChange_key}
                        transformValueBeingTyped={toUpperCase}
                    />
                )}
            </TableCell>
            <TableCell
                className={cx(
                    classes.keyAndValueTableCells,
                    css(
                        [width * 0.36].map(width => ({
                            width,
                            maxWidth: width
                        }))[0]
                    )
                )}
            >
                {!isInEditingState ? (
                    <SmartTrim className={classes.valueAndResolvedValue}>
                        {isTextHidden ? "•••••••••" : strValue}
                    </SmartTrim>
                ) : (
                    <TextField
                        defaultValue={strValue}
                        inputProps_aria-label={t("value input desc")}
                        onEscapeKeyDown={onEscapeKeyDown}
                        onEnterKeyDown={onEnterKeyDown}
                        evtAction={evtInputAction}
                        onSubmit={onSubmitFactory("editedStrValue")}
                    />
                )}
            </TableCell>
            <TableCell align="right">
                <div className={css({ display: "flex" })}>
                    <IconButton
                        icon={
                            isInEditingState
                                ? getIconUrlByName("Check")
                                : getIconUrlByName("Edit")
                        }
                        disabled={isInEditingState ? isSubmitButtonDisabled : isLocked}
                        onClick={
                            isInEditingState ? onSubmitButtonClick : onEditButtonClick
                        }
                        size="small"
                    />
                    <IconButton
                        disabled={isLocked}
                        icon={getIconUrlByName("Delete")}
                        onClick={onDelete}
                        size="small"
                    />
                    <IconButton
                        icon={
                            isTextHidden
                                ? getIconUrlByName("Visibility")
                                : getIconUrlByName("VisibilityOff")
                        }
                        onClick={() => setIsTextHidden(!isTextHidden)}
                    />
                </div>
            </TableCell>
        </TableRow>
    );
});

const { i18n } = declareComponentKeys<"key input desc" | "value input desc">()({
    MySecretsEditorRow
});
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<MySecretsEditorRowProps & { isInEditingState: boolean }>()
    .withName({ MySecretsEditorRow })
    .create(({ theme, isInEditingState, isDarker }) => ({
        root: {
            backgroundColor: isDarker
                ? theme.colors.useCases.surfaces.background
                : "transparent",
            "& .MuiTextField-root": {
                width: "100%"
            }
        },
        dollarSign: {
            color: isInEditingState
                ? theme.colors.useCases.typography.textDisabled
                : theme.colors.useCases.typography.textFocus
        },
        valueAndResolvedValue: {
            padding: theme.spacing({ topBottom: 3, rightLeft: 2 })
            //"wordBreak": "break-all"
        },
        keyAndValueTableCells: {
            padding: isInEditingState
                ? theme.spacing({ topBottom: 0, rightLeft: 3 })
                : undefined
        }
    }));

function toUpperCase(value: string) {
    return value.toUpperCase();
}
