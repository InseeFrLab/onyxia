import { useEffect, useState, memo } from "react";
import type { ReactNode, FunctionComponent } from "react";
import { useGuaranteedMemo } from "powerhooks";
import { useConstCallback } from "powerhooks";
import type { NonPostableEvt } from "evt";
import type { TextFieldProps } from "app/components/designSystem/TextField";
import { Typography } from "app/components/designSystem/Typography";
import { createUseClassNames } from "app/theme/useClassNames";
import { TextField } from "app/components/designSystem/TextField";
import { UnpackEvt } from "evt";
import { Evt } from "evt";
import type { Params } from "evt/tools/typeSafety";
import { IconButton } from "app/components/designSystem/IconButton";
import { useCallbackFactory } from "powerhooks";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Switch from "@material-ui/core/Switch";
import { useTranslation } from "app/i18n/useTranslations";
import { ChangeLanguage } from "app/components/shared/ChangeLanguage";
import { useEvt } from "evt/hooks";
import { Tooltip } from "app/components/designSystem/Tooltip";
import { useValidUntil } from "app/i18n/useMoment";
import { cx } from "tss-react";
import { assert } from "tsafe/assert";

export type Props<T extends string = string> =
    Props.ServicePassword |
    Props.S3Scripts<T> |
    Props.Language |
    Props.Toggle |
    Props.Text |
    Props.EditableText |
    Props.OidcAccessToken;

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

    export type OidcAccessToken = Common & {
        type: "OIDC Access token";
        oidcAccessToken: string;
        onRequestOidcAccessTokenRenewal(): void;
        isLocked: boolean;
        /** In seconds */
        remainingValidity: number;
    } & ICopyable;

    export type Toggle = Common & {
        type: "toggle";
        isOn: boolean;
        onRequestToggle(): void;
        isLocked: boolean;
    } & IGeneric;


    export type Text = Common & {
        type: "text";
        text: string;
    } & ICopyable & IGeneric;

    export type EditableText = Common & {
        type: "editable text";
        text: string | undefined;
        onRequestEdit(newText: string): void;
        onStartEdit(): void;
        evtAction: NonPostableEvt<"SUBMIT EDIT">;
        getIsValidValue?: TextFieldProps["getIsValidValue"];
        isLocked: boolean;
    } & ICopyable & IGeneric;

    type IGeneric = Common & {
        title: string;
        helperText?: ReactNode;
    };

    type ICopyable = Common & {
        onRequestCopy(): void;
    }

}

const flashDurationMs = 600;

const { useClassNames } = createUseClassNames<{ isFlashing: boolean; }>()(
    (theme, { isFlashing }) => ({
        "root": {
            "marginBottom": theme.spacing(2)
        },
        "mainLine": {
            "display": "flex",
            "& > div": {
                "display": "flex",
                "alignItems": "center"
            },
            "marginBottom": theme.spacing(1)
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
                "color": !isFlashing ?
                    undefined :
                    theme.custom.colors.useCases.buttons.actionActive,
            },
            "& .MuiTextField-root": {
                "width": "100%",
                "top": 2
            }
        },
        "cellActions": {
            "marginRight": theme.spacing(1)
        },
        "noText": {
            "color": theme.custom.colors.useCases.typography.textDisabled
        }
    })
);


export const AccountField = memo(<T extends string>(props: Props<T>): ReturnType<FunctionComponent> => {

    const { t } = useTranslation("AccountField");

    const { className } = props;

    const [isFlashing, setIsFlashing] = useState(false);

    useEffect(
        () => {

            if (!isFlashing) return;

            const timer = setTimeout(() => setIsFlashing(false), flashDurationMs);

            return () => clearTimeout(timer);

        },
        [isFlashing]
    );

    const onRequestCopy = useConstCallback(
        () => {

            assert("onRequestCopy" in props);

            setIsFlashing(true);

            props.onRequestCopy();

        },
    );

    const { classNames } = useClassNames({ isFlashing });

    const TypographyWd = useGuaranteedMemo(() =>
        (props: { children: NonNullable<ReactNode>; className?: string; }) =>
            <Typography 
                variant="body1"
                className={props.className}
            >{props.children}</Typography>,
        []
    );

    const IconButtonCopyToClipboard = useGuaranteedMemo(() =>
        (props: { onClick(): void; disabled?: boolean; }) =>
            <Tooltip title={t("copy tooltip")}>
                <IconButton
                    type="filterNone"
                    onClick={props.onClick}
                    fontSize="small"
                    disabled={props.disabled ?? false}
                />
            </Tooltip>,
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

        const [evtTextFieldAction] = useState(
            () => Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
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
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [props?.type === "editable text" ? props.evtAction : null]
        );

        const onStartEditButtonClick = useConstCallback(() => {
            setIsInEditingState(true);
            assert(props.type === "editable text");
            props.onStartEdit();
        });


        const onTextFieldEscapeKeyDown = useConstCallback(
            () => evtTextFieldAction.post("RESTORE DEFAULT VALUE")
        );

        const onSubmitButtonClick = useConstCallback(
            () => evtTextFieldAction.post("TRIGGER SUBMIT")
        );

        const { isValueBeingTypedValid, onValueBeingTypedChange } = (function useClosure() {

            const [isValueBeingTypedValid, setIsValueBeingTypedValid] = useState(false);

            const onValueBeingTypedChange = useConstCallback(
                ({ isValidValue }: Params<TextFieldProps["onValueBeingTypedChange"]>) =>
                    setIsValueBeingTypedValid(isValidValue)
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

            }
        );

        useEffect(
            () => {
                if (!isCopyScheduled) return;
                setIsCopyScheduled(false);
                onRequestCopy();
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [props.type === "editable text" ? props.text : null]
        );

        useEffect(
            () => {
                if (!isCopyScheduled) return;
                evtTextFieldAction.post("TRIGGER SUBMIT");
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [isCopyScheduled]
        );

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

    const {
        onS3ScriptClickFactory,
        selectedS3Script,
        onS3ScriptSelectChange
    } = (function useClosure() {

        const [selectedS3Script, setSelectedS3Script] = useState(
            props.type === "s3 scripts" ?
                props.scriptLabels[0] : null as never
        );

        const onS3ScriptClickFactory = useCallbackFactory(
            ([action]: ["download" | "copy"]) => {
                assert(props.type === "s3 scripts");
                props[(() => {
                    switch (action) {
                        case "copy": return "onRequestCopyScript" as const;
                        case "download": return "onRequestDownloadScript" as const;
                    }
                })()](selectedS3Script)
            }
        );

        const onS3ScriptSelectChange = useConstCallback(
            (event: React.ChangeEvent<{ value: unknown; }>) =>
                setSelectedS3Script(event.target.value as T)
        );

        return {
            onS3ScriptClickFactory,
            selectedS3Script,
            onS3ScriptSelectChange
        };

    })();

    const oidcAccessTokenExpiresWhen = useValidUntil({
        "millisecondsLeft": props.type !== "OIDC Access token" ?
            0 : props.remainingValidity * 1000
    });

    const helperText = (() => {
        switch (props.type) {
            case "text":
            case "editable text":
            case "toggle":
                return props.helperText;
            case "service password":
                return t("service password helper text");
            case "OIDC Access token":
                return t(
                    "OIDC Access token helper text",
                    { "when": oidcAccessTokenExpiresWhen }
                );
            default:
                return undefined;
        }
    })();


    return (
        <div className={cx(classNames.root,className)}>
            <div className={classNames.mainLine}>
                <div className={classNames.cellTitle}>
                    <Typography variant="subtitle1" >
                        {"title" in props ? props.title : t(props.type)}
                    </Typography>
                </div>
                <div className={classNames.cellMiddle}>
                    {(() => {
                        switch (props.type) {
                            case "s3 scripts":
                                return (
                                    <FormControl>
                                        <Select
                                            value={selectedS3Script}
                                            onChange={onS3ScriptSelectChange}
                                        >
                                            {
                                                props.scriptLabels.map(
                                                    scriptLabel =>
                                                        <MenuItem value={scriptLabel}>
                                                            {scriptLabel}
                                                        </MenuItem>
                                                )
                                            }
                                        </Select>
                                    </FormControl>
                                );
                            case "language":
                                return <ChangeLanguage doShowIcon={false} />;
                            case "toggle":
                                return null;
                            case "service password":
                                return <TypographyWd>{props.servicePassword}</TypographyWd>;
                            case "OIDC Access token":
                                return <TypographyWd>{props.oidcAccessToken}</TypographyWd>
                            case "text":
                                return <TypographyWd>{props.text}</TypographyWd>;
                            case "editable text":
                                return !isInEditingState ?
                                        props.text===undefined ?
                                            <TypographyWd className={classNames.noText}>{t("not yet defined")}</TypographyWd> :
                                            <TypographyWd>{props.text}</TypographyWd> 
                                            :
                                    <TextField
                                        defaultValue={props.text}
                                        onEscapeKeyDown={onTextFieldEscapeKeyDown}
                                        onEnterKeyDown={onSubmitButtonClick}
                                        evtAction={evtTextFieldAction}
                                        onSubmit={onTextFieldSubmit}
                                        getIsValidValue={props.getIsValidValue}
                                        onValueBeingTypedChange={onValueBeingTypedChange}
                                        doOnlyValidateInputAfterFistFocusLost={false}
                                        isSubmitAllowed={!props.isLocked}
                                        inputProps_autoFocus={true}
                                        selectAllTextOnFocus={true}
                                        inputProps_spellCheck={false}
                                    />;
                        }
                    })()}
                </div>
                <div className={classNames.cellActions}>
                    {(() => {
                        switch (props.type) {
                            case "s3 scripts":
                                return (
                                    <>
                                        <IconButton
                                            type="getApp"
                                            onClick={onS3ScriptClickFactory("download")}
                                            fontSize="small"
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
                                            type={isInEditingState ? "check" : "edit"}
                                            disabled={props.isLocked || (isInEditingState && !isValueBeingTypedValid)}
                                            onClick={isInEditingState ? onSubmitButtonClick : onStartEditButtonClick}
                                            fontSize="small"
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
                                        onChange={props.isLocked ? undefined : props.onRequestToggle}
                                        color="primary"
                                    />
                                );
                            case "service password":
                                return (
                                    <>
                                        <IconButton
                                            type="replay"
                                            fontSize="small"
                                            disabled={props.isLocked}
                                            onClick={props.onRequestServicePasswordRenewal}
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
                            case "OIDC Access token":
                                return (
                                    <>
                                        {/*
                                        <IconButton
                                            type="replay"
                                            fontSize="small"
                                            disabled={props.isLocked}
                                            onClick={props.onRequestOidcAccessTokenRenewal}
                                        />
                                        */}
                                        <IconButtonCopyToClipboard
                                            onClick={onRequestCopy}
                                        />
                                    </>
                                );
                        }
                    })()}
                </div>
            </div>
            { helperText !== undefined &&
                <Typography variant="caption"> {helperText} </Typography>
            }


        </div>
    );



});

export declare namespace AccountField {

    export type I18nScheme = Record<
        Exclude<Props["type"], "text" | "editable text" | "toggle">,
        undefined
    > & {
        'copy tooltip': undefined;
        'service password helper text': undefined;
        'OIDC Access token helper text': { when: string; };
        'not yet defined': undefined;
    };

}