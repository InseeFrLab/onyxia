import { useEffect, useState, useReducer, memo } from "react";
import type { ReactNode, FunctionComponent } from "react";
import { useGuaranteedMemo } from "powerhooks/useGuaranteedMemo";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { NonPostableEvt } from "evt";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { TextField } from "onyxia-ui/TextField";
import { Tooltip } from "onyxia-ui/Tooltip";
import { makeStyles, Text } from "app/theme";
import { UnpackEvt } from "evt";
import { Evt } from "evt";
import type { Param0 } from "tsafe";
import { IconButton, LanguageSelect } from "app/theme";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import Select from "@material-ui/core/Select";
import type { SelectChangeEvent } from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Switch from "@material-ui/core/Switch";
import { useTranslation } from "app/i18n/useTranslations";
import { useEvt } from "evt/hooks";
import { assert } from "tsafe/assert";
import { Button } from "app/theme";
import { useLng } from "app/i18n/useLng";

export type Props<T extends string = string> =
    | Props.ServicePassword
    | Props.S3Scripts<T>
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
        servicePassword: string;
        onRequestServicePasswordRenewal(): void;
        isLocked: boolean;
    } & ICopyable;

    export type S3Scripts<T extends string> = Common & {
        type: "s3 scripts";
        scriptLabels: T[];
        onRequestDownloadScript(scriptLabel: T): void;
        onRequestCopyScript(scriptLabelg: T): void;
    };

    export type Language = Common & {
        type: "language";
    };

    export type Toggle = Common & {
        type: "toggle";
        isOn: boolean;
        onRequestToggle(): void;
        isLocked: boolean;
    } & IGeneric;

    export type Text = Common & {
        type: "text";
        text: string;
    } & ICopyable &
        IGeneric;

    export type EditableText = Common & {
        type: "editable text";
        text: string | undefined;
        onRequestEdit(newText: string): void;
        onStartEdit(): void;
        evtAction: NonPostableEvt<"SUBMIT EDIT">;
        getIsValidValue?: TextFieldProps["getIsValidValue"];
        isLocked: boolean;
    } & ICopyable &
        IGeneric;

    export type ResetHelperDialogs = Common & {
        type: "reset helper dialogs";
        onResetHelperDialogsClick(): void;
    };

    type IGeneric = Common & {
        title: string;
        helperText?: ReactNode;
    };

    type ICopyable = Common & {
        onRequestCopy(): void;
    };
}

const flashDurationMs = 600;

const useStyles = makeStyles<{ isFlashing: boolean }>()((theme, { isFlashing }) => ({
    "root": {
        "marginBottom": theme.spacing(3),
    },
    "mainLine": {
        "display": "flex",
        "& > div": {
            "display": "flex",
            "alignItems": "center",
        },
        "marginBottom": theme.spacing(2),
    },
    "cellTitle": {
        "width": 360,
    },
    "cellMiddle": {
        "flex": 1,
        "overflow": "hidden",
        "& .MuiTypography-root": {
            "overflow": "hidden",
            "whiteSpace": "nowrap",
            "textOverflow": "ellipsis",
            "color": !isFlashing ? undefined : theme.colors.useCases.buttons.actionActive,
        },
        "& .MuiTextField-root": {
            "width": "100%",
            "top": 2,
        },
    },
    "cellActions": {
        "marginRight": theme.spacing(2),
    },
    "noText": {
        "color": theme.colors.useCases.typography.textDisabled,
    },
}));

export const AccountField = memo(
    <T extends string>(props: Props<T>): ReturnType<FunctionComponent> => {
        const { t } = useTranslation("AccountField");

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

        const TextWd = useGuaranteedMemo(
            () => (props: { children: NonNullable<ReactNode>; className?: string }) =>
                (
                    <Text typo="body 1" className={props.className}>
                        {props.children}
                    </Text>
                ),
            [],
        );

        const IconButtonCopyToClipboard = useGuaranteedMemo(
            () => (props: { onClick(): void; disabled?: boolean }) =>
                (
                    <Tooltip title={t("copy tooltip")}>
                        <IconButton
                            iconId="filterNone"
                            onClick={props.onClick}
                            size="small"
                            disabled={props.disabled ?? false}
                        />
                    </Tooltip>
                ),
            [],
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
            onTextFieldSubmit,
        } = (function useClosure() {
            const [isInEditingState, setIsInEditingState] = useState(false);

            const [evtTextFieldAction] = useState(() =>
                Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>(),
            );

            useEvt(
                ctx => {
                    if (props.type !== "editable text") {
                        return;
                    }

                    props.evtAction.attach(
                        action => action === "SUBMIT EDIT",
                        ctx,
                        () => evtTextFieldAction.post("TRIGGER SUBMIT"),
                    );
                },

                [props?.type === "editable text" ? props.evtAction : null],
            );

            const onStartEditButtonClick = useConstCallback(() => {
                setIsInEditingState(true);
                assert(props.type === "editable text");
                props.onStartEdit();
            });

            const onTextFieldEscapeKeyDown = useConstCallback(() =>
                evtTextFieldAction.post("RESTORE DEFAULT VALUE"),
            );

            const onSubmitButtonClick = useConstCallback(() =>
                evtTextFieldAction.post("TRIGGER SUBMIT"),
            );

            const { isValueBeingTypedValid, onValueBeingTypedChange } =
                (function useClosure() {
                    const [isValueBeingTypedValid, setIsValueBeingTypedValid] =
                        useState(false);

                    const onValueBeingTypedChange = useConstCallback(
                        ({
                            isValidValue,
                        }: Param0<TextFieldProps["onValueBeingTypedChange"]>) =>
                            setIsValueBeingTypedValid(isValidValue),
                    );

                    return { isValueBeingTypedValid, onValueBeingTypedChange };
                })();

            const [isCopyScheduled, setIsCopyScheduled] = useState(false);

            const onTextFieldSubmit = useConstCallback<TextFieldProps["onSubmit"]>(
                value => {
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
                },
            );

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
                onTextFieldSubmit,
            };
        })();

        const { onS3ScriptClickFactory, selectedS3Script, onS3ScriptSelectChange } =
            (function useClosure() {
                const [selectedS3Script, setSelectedS3Script] = useState(
                    props.type === "s3 scripts" ? props.scriptLabels[0] : (null as never),
                );

                const onS3ScriptClickFactory = useCallbackFactory(
                    ([action]: ["download" | "copy"]) => {
                        assert(props.type === "s3 scripts");
                        props[
                            (() => {
                                switch (action) {
                                    case "copy":
                                        return "onRequestCopyScript" as const;
                                    case "download":
                                        return "onRequestDownloadScript" as const;
                                }
                            })()
                        ](selectedS3Script);
                    },
                );

                const onS3ScriptSelectChange = useConstCallback(
                    (event: SelectChangeEvent<T>) =>
                        setSelectedS3Script(event.target.value as T),
                );

                return {
                    onS3ScriptClickFactory,
                    selectedS3Script,
                    onS3ScriptSelectChange,
                };
            })();

        const helperText = (() => {
            switch (props.type) {
                case "text":
                case "editable text":
                case "toggle":
                    return props.helperText;
                case "service password":
                    return t("service password helper text");
                case "reset helper dialogs":
                    return t("reset helper dialogs helper text");
                default:
                    return undefined;
            }
        })();

        const [isResetHelperDialogClicked, setIsResetHelperDialogClickedToTrue] =
            useReducer(() => true, false);

        const onResetHelperDialogsClick = useConstCallback(() => {
            assert(props.type === "reset helper dialogs");
            setIsResetHelperDialogClickedToTrue();
            props.onResetHelperDialogsClick();
        });

        const { lng, setLng } = useLng();

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
                                case "s3 scripts":
                                    return (
                                        <FormControl>
                                            <Select
                                                value={selectedS3Script}
                                                onChange={onS3ScriptSelectChange}
                                            >
                                                {props.scriptLabels.map(scriptLabel => (
                                                    <MenuItem
                                                        value={scriptLabel}
                                                        key={scriptLabel}
                                                    >
                                                        {scriptLabel}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    );
                                case "language":
                                    return (
                                        <LanguageSelect
                                            doShowIcon={false}
                                            variant="big"
                                            language={lng}
                                            onLanguageChange={setLng}
                                        />
                                    );
                                case "toggle":
                                    return null;
                                case "service password":
                                    return <TextWd>{props.servicePassword}</TextWd>;
                                case "text":
                                    return <TextWd>{props.text}</TextWd>;
                                case "editable text":
                                    return !isInEditingState ? (
                                        props.text === undefined ? (
                                            <TextWd className={classes.noText}>
                                                {t("not yet defined")}
                                            </TextWd>
                                        ) : (
                                            <TextWd>{props.text}</TextWd>
                                        )
                                    ) : (
                                        <TextField
                                            defaultValue={props.text}
                                            onEscapeKeyDown={onTextFieldEscapeKeyDown}
                                            onEnterKeyDown={onSubmitButtonClick}
                                            evtAction={evtTextFieldAction}
                                            onSubmit={onTextFieldSubmit}
                                            getIsValidValue={props.getIsValidValue}
                                            onValueBeingTypedChange={
                                                onValueBeingTypedChange
                                            }
                                            doOnlyValidateInputAfterFistFocusLost={false}
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
                        {(() => {
                            switch (props.type) {
                                case "s3 scripts":
                                    return (
                                        <>
                                            <IconButton
                                                iconId="getApp"
                                                onClick={onS3ScriptClickFactory(
                                                    "download",
                                                )}
                                                size="small"
                                            />
                                            <IconButtonCopyToClipboard
                                                onClick={onS3ScriptClickFactory("copy")}
                                            />
                                        </>
                                    );
                                case "editable text":
                                    return (
                                        <>
                                            <IconButton
                                                iconId={
                                                    isInEditingState ? "check" : "edit"
                                                }
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
                                                iconId="replay"
                                                size="small"
                                                disabled={props.isLocked}
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
                                        <IconButtonCopyToClipboard
                                            onClick={onRequestCopy}
                                        />
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
    },
);

export declare namespace AccountField {
    export type I18nScheme = Record<
        Exclude<Props["type"], "text" | "editable text" | "toggle">,
        undefined
    > & {
        "copy tooltip": undefined;
        "service password helper text": undefined;
        "not yet defined": undefined;
        "reset helper dialogs helper text": undefined;
        "reset": undefined;
    };
}
