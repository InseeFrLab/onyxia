import { useEffect, useState, useReducer, memo } from "react";
import type { ReactNode, FunctionComponent } from "react";
import { useGuaranteedMemo } from "powerhooks/useGuaranteedMemo";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { NonPostableEvt } from "evt";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { TextField } from "onyxia-ui/TextField";
import { Tooltip } from "onyxia-ui/Tooltip";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { UnpackEvt } from "evt";
import { Evt } from "evt";
import type { Param0 } from "tsafe";
import { LanguageSelect } from "onyxia-ui/LanguageSelect";
import Switch from "@mui/material/Switch";
import { useTranslation } from "ui/i18n";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { Button } from "onyxia-ui/Button";
import { IconButton } from "onyxia-ui/IconButton";
import { useLang } from "ui/i18n";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";
import { languagesPrettyPrint } from "ui/i18n";

export type Props =
    | Props.ServicePassword
    | Props.Language
    | Props.Toggle
    | Props.Text
    | Props.EditableText
    | Props.ResetHelperDialogs;

export declare namespace Props {
    type Common = {
        className?: string;
    };

    export type ServicePassword = Common & {
        type: "service password";
        groupProjectName: string | undefined;
        servicePassword: string;
        onRequestServicePasswordRenewal: () => void;
    } & ICopyable;

    export type Language = Common & {
        type: "language";
    };

    export type Toggle = Common & {
        type: "toggle";
        isOn: boolean;
        onRequestToggle: () => void;
        isLocked: boolean;
    } & IGeneric;

    export type Text = Common & {
        type: "text";
        text: string;
        isSensitiveInformation?: boolean;
    } & ICopyable &
        IGeneric;

    export type EditableText = Common & {
        type: "editable text";
        text: string | undefined;
        onRequestEdit(newText: string): void;
        onStartEdit: () => void;
        evtAction: NonPostableEvt<"SUBMIT EDIT">;
        getIsValidValue?: TextFieldProps["getIsValidValue"];
        isLocked: boolean;
        isSensitiveInformation?: boolean;
    } & ICopyable &
        IGeneric;

    export type ResetHelperDialogs = Common & {
        type: "reset helper dialogs";
        onResetHelperDialogsClick: () => void;
    };

    type IGeneric = {
        title: string;
        helperText?: ReactNode;
    };

    type ICopyable = {
        onRequestCopy: () => void;
    };
}

const flashDurationMs = 600;

export const SettingField = memo((props: Props): ReturnType<FunctionComponent> => {
    const { t } = useTranslation({ SettingField });

    const { className } = props;

    const [isFlashing, setIsFlashing] = useState(false);

    useEffect(() => {
        if (!isFlashing) return;

        const timer = setTimeout(() => setIsFlashing(false), flashDurationMs);

        return () => clearTimeout(timer);
    }, [isFlashing]);

    const onRequestCopy = useConstCallback(() => {
        assert("onRequestCopy" in props);

        setIsFlashing(true);

        props.onRequestCopy();
    });

    const { classes, cx } = useStyles({ isFlashing });

    const { TextWd, toggleIsTextHidden, isTextHidden, isSensitiveInformation } =
        (function useClosure() {
            const isSensitiveInformation = (() => {
                switch (props.type) {
                    case "text":
                    case "editable text":
                        return props.isSensitiveInformation ?? false;
                    case "service password":
                        return true;
                    default:
                        return false;
                }
            })();

            const [isTextHidden, setIsTextHidden] = useState(isSensitiveInformation);

            useEffectOnValueChange(() => {
                setIsTextHidden(isSensitiveInformation);
            }, [isSensitiveInformation]);

            const toggleIsTextHidden = useConstCallback(() =>
                setIsTextHidden(!isTextHidden)
            );

            const { TextWd } = useGuaranteedMemo(() => {
                const TextWd = memo((props: { children: string; className?: string }) => (
                    <Text typo="body 1" className={props.className}>
                        {isTextHidden
                            ? new Array(props.children.length).fill("•")
                            : props.children}
                    </Text>
                ));

                return { TextWd };
            }, [isTextHidden]);

            return {
                TextWd,
                toggleIsTextHidden,
                isTextHidden,
                isSensitiveInformation
            };
        })();

    const IconButtonCopyToClipboard = useGuaranteedMemo(
        () => (props: { onClick(): void; disabled?: boolean }) => (
            <Tooltip title={t("copy tooltip")}>
                <IconButton
                    icon={getIconUrlByName("FilterNone")}
                    onClick={props.onClick}
                    size="small"
                    disabled={props.disabled ?? false}
                />
            </Tooltip>
        ),
        []
    );

    const {
        isInEditingState,
        evtTextFieldAction,
        isValueBeingTypedValid,
        onEditableTextRequestCopy,
        onStartEditButtonClick,
        onTextFieldEscapeKeyDown,
        onSubmitButtonClick,
        onValueBeingTypedChange,
        onTextFieldSubmit
    } = (function useClosure() {
        const [isInEditingState, setIsInEditingState] = useState(false);

        const [evtTextFieldAction] = useState(() =>
            Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
        );

        useEvt(
            ctx => {
                if (props.type !== "editable text") {
                    return;
                }

                props.evtAction.attach(
                    action => action === "SUBMIT EDIT",
                    ctx,
                    () => evtTextFieldAction.post("TRIGGER SUBMIT")
                );
            },

            [props?.type === "editable text" ? props.evtAction : null]
        );

        const onStartEditButtonClick = useConstCallback(() => {
            setIsInEditingState(true);
            assert(props.type === "editable text");
            props.onStartEdit();
        });

        const onTextFieldEscapeKeyDown = useConstCallback(() =>
            evtTextFieldAction.post("RESTORE DEFAULT VALUE")
        );

        const onSubmitButtonClick = useConstCallback(() =>
            evtTextFieldAction.post("TRIGGER SUBMIT")
        );

        const { isValueBeingTypedValid, onValueBeingTypedChange } =
            (function useClosure() {
                const [isValueBeingTypedValid, setIsValueBeingTypedValid] =
                    useState(false);

                const onValueBeingTypedChange = useConstCallback(
                    ({
                        isValidValue
                    }: Param0<TextFieldProps["onValueBeingTypedChange"]>) =>
                        setIsValueBeingTypedValid(isValidValue)
                );

                return { isValueBeingTypedValid, onValueBeingTypedChange };
            })();

        const [isCopyScheduled, setIsCopyScheduled] = useState(false);

        const onTextFieldSubmit = useConstCallback<TextFieldProps["onSubmit"]>(value => {
            assert(props.type === "editable text");
            if (props.isLocked) return;

            setIsInEditingState(false);

            if (value === props.text) {
                if (isCopyScheduled) {
                    setIsCopyScheduled(false);
                    onRequestCopy();
                }

                return;
            }

            props.onRequestEdit(value);
        });

        useEffect(() => {
            if (!isCopyScheduled) return;
            setIsCopyScheduled(false);
            onRequestCopy();
        }, [props.type === "editable text" ? props.text : null]);

        useEffect(() => {
            if (!isCopyScheduled) return;
            evtTextFieldAction.post("TRIGGER SUBMIT");
        }, [isCopyScheduled]);

        const onEditableTextRequestCopy = useConstCallback(() => {
            if (isInEditingState) {
                setIsCopyScheduled(true);
            } else {
                onRequestCopy();
            }
        });

        return {
            isInEditingState,
            evtTextFieldAction,
            isValueBeingTypedValid,
            onEditableTextRequestCopy,
            onStartEditButtonClick,
            onTextFieldEscapeKeyDown,
            onSubmitButtonClick,
            onValueBeingTypedChange,
            onTextFieldSubmit
        };
    })();

    const helperText = (() => {
        switch (props.type) {
            case "text":
            case "editable text":
            case "toggle":
                return props.helperText;
            case "service password":
                return t("service password helper text", {
                    groupProjectName: props.groupProjectName
                });
            case "reset helper dialogs":
                return t("reset helper dialogs helper text");
            default:
                return undefined;
        }
    })();

    const [isResetHelperDialogClicked, setIsResetHelperDialogClickedToTrue] = useReducer(
        () => true,
        false
    );

    const onResetHelperDialogsClick = useConstCallback(() => {
        assert(props.type === "reset helper dialogs");
        setIsResetHelperDialogClickedToTrue();
        props.onResetHelperDialogsClick();
    });

    const { lang, setLang } = useLang();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.mainLine}>
                <div className={classes.cellTitle}>
                    <Text typo="label 1">
                        {"title" in props ? props.title : t(props.type)}
                    </Text>
                </div>
                <div className={classes.cellMiddle}>
                    {(() => {
                        switch (props.type) {
                            case "language":
                                return (
                                    <LanguageSelect
                                        languagesPrettyPrint={languagesPrettyPrint}
                                        doShowIcon={false}
                                        variant="big"
                                        language={lang}
                                        onLanguageChange={setLang}
                                    />
                                );
                            case "toggle":
                                return null;
                            case "service password":
                                return (
                                    <TextWd className={classes.cellMiddleText}>
                                        {props.servicePassword}
                                    </TextWd>
                                );
                            case "text":
                                return (
                                    <TextWd className={classes.cellMiddleText}>
                                        {props.text}
                                    </TextWd>
                                );
                            case "editable text":
                                return !isInEditingState ? (
                                    props.text === undefined ? (
                                        <TextWd
                                            className={cx(
                                                classes.noText,
                                                classes.cellMiddleText
                                            )}
                                        >
                                            {t("not yet defined")}
                                        </TextWd>
                                    ) : (
                                        <TextWd className={classes.cellMiddleText}>
                                            {props.text}
                                        </TextWd>
                                    )
                                ) : (
                                    <TextField
                                        defaultValue={props.text}
                                        onEscapeKeyDown={onTextFieldEscapeKeyDown}
                                        onEnterKeyDown={onSubmitButtonClick}
                                        evtAction={evtTextFieldAction}
                                        onSubmit={onTextFieldSubmit}
                                        getIsValidValue={props.getIsValidValue}
                                        onValueBeingTypedChange={onValueBeingTypedChange}
                                        isSubmitAllowed={!props.isLocked}
                                        inputProps_autoFocus={true}
                                        selectAllTextOnFocus={true}
                                        inputProps_spellCheck={false}
                                    />
                                );
                        }
                    })()}
                </div>
                <div className={classes.cellActions}>
                    {isSensitiveInformation && (
                        <IconButton
                            icon={getIconUrlByName(
                                isTextHidden ? "Visibility" : "VisibilityOff"
                            )}
                            onClick={toggleIsTextHidden}
                        />
                    )}
                    {(() => {
                        switch (props.type) {
                            case "editable text":
                                return (
                                    <>
                                        <IconButton
                                            icon={getIconUrlByName(
                                                isInEditingState ? "Check" : "Edit"
                                            )}
                                            disabled={
                                                props.isLocked ||
                                                (isInEditingState &&
                                                    !isValueBeingTypedValid)
                                            }
                                            onClick={
                                                isInEditingState
                                                    ? onSubmitButtonClick
                                                    : onStartEditButtonClick
                                            }
                                            size="small"
                                        />
                                        <IconButtonCopyToClipboard
                                            disabled={props.text === undefined}
                                            onClick={onEditableTextRequestCopy}
                                        />
                                    </>
                                );
                            case "toggle":
                                return (
                                    <Switch
                                        checked={props.isOn}
                                        onChange={
                                            props.isLocked
                                                ? undefined
                                                : props.onRequestToggle
                                        }
                                        color="primary"
                                    />
                                );
                            case "service password":
                                return (
                                    <>
                                        <IconButton
                                            icon={getIconUrlByName("Replay")}
                                            size="small"
                                            onClick={
                                                props.onRequestServicePasswordRenewal
                                            }
                                        />
                                        <IconButtonCopyToClipboard
                                            onClick={onRequestCopy}
                                        />
                                    </>
                                );
                            case "text":
                                return (
                                    <IconButtonCopyToClipboard onClick={onRequestCopy} />
                                );
                            case "language":
                                return null;
                            case "reset helper dialogs":
                                return (
                                    <Button
                                        disabled={isResetHelperDialogClicked}
                                        variant="secondary"
                                        onClick={onResetHelperDialogsClick}
                                    >
                                        {t("reset")}
                                    </Button>
                                );
                        }
                    })()}
                </div>
            </div>
            {helperText !== undefined && <Text typo="caption"> {helperText} </Text>}
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | Exclude<Props["type"], "text" | "editable text" | "toggle">
    | "copy tooltip"
    | {
          K: "service password helper text";
          P: { groupProjectName: string | undefined };
          R: JSX.Element;
      }
    | "not yet defined"
    | "reset helper dialogs helper text"
    | "reset"
>()({ SettingField });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ SettingField })
    .withParams<{ isFlashing: boolean }>()
    .create(({ theme, isFlashing }) => ({
        root: {
            marginBottom: theme.spacing(3)
        },
        mainLine: {
            display: "flex",
            "& > div": {
                display: "flex",
                alignItems: "center"
            },
            marginBottom: theme.spacing(2)
        },
        cellTitle: {
            width: 360
        },
        cellMiddle: {
            flex: 1,
            overflow: "hidden",
            "& .MuiTextField-root": {
                width: "100%",
                top: 2
            }
        },
        cellMiddleText: {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            color: !isFlashing ? undefined : theme.colors.useCases.buttons.actionActive
        },
        cellActions: {
            marginRight: theme.spacing(2)
        },
        noText: {
            color: theme.colors.useCases.typography.textDisabled
        }
    }));
