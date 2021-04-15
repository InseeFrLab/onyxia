import { useEffect, useState, memo } from "react";
import type { ReactNode, FunctionComponent } from "react";
import { useGuaranteedMemo } from "powerhooks";
import { useConstCallback } from "powerhooks";
import type { NonPostableEvt } from "evt";
import type { TextFieldProps } from "app/components/designSystem/TextField";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import { Typography } from "app/components/designSystem/Typography";
import { createUseClassNames } from "app/theme/useClassNames";
import { TextField } from "app/components/designSystem/TextField";
import { assert } from "evt/tools/typeSafety/assert";
import { UnpackEvt } from "evt";
import { Evt } from "evt";
import type { Params } from "evt/tools/typeSafety";
import { IconButton } from "app/components/designSystem/IconButton";
import { useCallbackFactory } from "powerhooks";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Switch from "@material-ui/core/Switch";
import { cx, keyframes } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";

export type Props<T extends string = string> =
    Props.ServicePassword |
    Props.DownloadS3InitScript<T> |
    Props.SwitchLanguage<T> |
    Props.Toggle |
    Props.Text |
    Props.EditableText;

export declare namespace Props {

    type Common ={
        className?: string;
    };

    export type ServicePassword = Common & {
        type: "service password";
        servicePassword: string;
        onRequestServicePasswordRenewal(): void;
        isLocked: boolean;
    } & ICopyable;

    export type DownloadS3InitScript<T extends string> = Common & {
        type: "s3 scripts";
        scriptList: T[];
        onRequestDownloadScrip(script: T): void;
        onRequestCopyScript(script: T): void;
    };

    export type SwitchLanguage<T extends string> = Common & {
        type: "language";
        languages: T[];
        onRequestLanguageChange(language: T): void;
    }

    export type Toggle = Common & {
        type: "toggle";
        isOn: boolean;
        onRequestToggle(): void;
        isLocked: boolean;
    } & IGeneric;


    export type Text = Common & {
        type: "text";
        text: string;
        title: string;
    } & ICopyable & IGeneric;

    export type EditableText = Common & {
        type: "editable text";
        text: string;
        onRequestEdit(newText: string): void;
        onStartEdit(): void;
        evtAction: NonPostableEvt<"ENTER EDITING STATE" | "SUBMIT EDIT">;
        getIsValidValue?: TextFieldProps["getIsValidValue"];
        isLocked: boolean;
    } & ICopyable & IGeneric;

    type IGeneric = Common & {
        title: string;
        helperText?: string;
    };

    type ICopyable = Common & {
        onRequestCopy(): void;
    }

}

const flashDurationMs = 600;

const { useClassNames } = createUseClassNames<{ isFlashing: boolean; }>()(
    (theme, { isFlashing }) => ({
        "mainRow": {
            "display": "flex",
            "& .MuiTableCell-root": {
                "display": "flex",
                "alignItems": "center",
                "& .MuiTypography-root": {
                    "marginTop": 2 //TODO: address globally
                }
            }
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
                /*
                "animation": !isFlashing ? undefined: `${keyframes`
                0% { }
                40%, 80% {
                    opacity: 1;

                }
                80% { }
            `} ${flashDurationMs}s ease-in-out`,
            */
            }
        },
        "helperTextCell": {
            "paddingTop": 0,
            "paddingBottom": 0
        }

    })
);


export const AccountRow = memo(<T extends string>(props: Props<T>): ReturnType<FunctionComponent> => {

    const { t } = useTranslation("AccountRow");

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
        (props: { children: NonNullable<ReactNode>; }) =>
            <Typography variant="body1">{props.children}</Typography>,
        []
    );

    const {
        isInEditingState,
        evtTextFieldAction,
        isValueBeingTypedValid,
        onTextFieldEscapeKeyDown,
        onSubmitButtonClick,
        onValueBeingTypedChange,
        onTextFieldSubmit
    } = (function useClosure() {

        const [isInEditingState, setIsInEditingState] = useState(false);

        const [evtTextFieldAction] = useState(
            () => Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
        );

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

        const onTextFieldSubmit = useConstCallback<TextFieldProps["onSubmit"]>(
            value => {
                assert(props.type === "editable text");
                if (props.isLocked) return;
                setIsInEditingState(false);
                props.onRequestEdit(value);
            }
        );

        return {
            isInEditingState,
            evtTextFieldAction,
            isValueBeingTypedValid,
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
                props.scriptList[0] : null as never
        );

        const onS3ScriptClickFactory = useCallbackFactory(
            ([action]: ["download" | "copy"]) => {
                assert(props.type === "s3 scripts");
                props[(() => {
                    switch (action) {
                        case "copy": return "onRequestCopyScript" as const;
                        case "download": return "onRequestDownloadScrip" as const;
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

    const {
        selectedLanguage,
        onLanguageSelectChange
    } = (function useClosure() {

        const [selectedLanguage, setSelectedLanguage] = useState(
            props.type === "language" ?
                props.languages[0] : null as never
        );

        const onLanguageSelectChange = useConstCallback(
            (event: React.ChangeEvent<{ value: unknown; }>) =>
                setSelectedLanguage(event.target.value as T)
        );

        return {
            selectedLanguage,
            onLanguageSelectChange
        };

    })();

    const helperText = (() => {
        switch (props.type) {
            case "text":
            case "editable text":
            case "toggle":
                return props.helperText;
            case "language":
                return undefined;
            case "s3 scripts":
                return t("s3 script helper text");
            case "service password":
                return t("service password helper text");
        }
    })();

    return (
        <>
            <TableRow className={cx(classNames.mainRow, className)}>
                <TableCell className={classNames.cellTitle}>
                    <Typography variant="subtitle1" >
                        {"title" in props ? props.title : t(props.type)}
                    </Typography>
                </TableCell>
                <TableCell className={classNames.cellMiddle}>
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
                                                props.scriptList.map(
                                                    scriptName =>
                                                        <MenuItem value={scriptName}>
                                                            {scriptName}
                                                        </MenuItem>
                                                )
                                            }
                                        </Select>
                                    </FormControl>
                                );
                            case "language":
                                return (
                                    <FormControl>
                                        <Select
                                            value={selectedLanguage}
                                            onChange={onLanguageSelectChange}
                                        >
                                            {
                                                props.languages.map(
                                                    language =>
                                                        <MenuItem value={language}>
                                                            {language}
                                                        </MenuItem>
                                                )
                                            }
                                        </Select>
                                    </FormControl>
                                );
                            case "toggle":
                                return null;
                            case "service password":
                                return <TypographyWd>{props.servicePassword}</TypographyWd>;
                            case "text":
                                return <TypographyWd>{props.text}</TypographyWd>;
                            case "editable text":
                                return !isInEditingState ?
                                    <TypographyWd>{props.text}</TypographyWd> :
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
                                    />;
                        }
                    })()}
                </TableCell>
                <TableCell>
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
                                        <IconButton
                                            type="filterNone"
                                            onClick={onS3ScriptClickFactory("download")}
                                            fontSize="small"
                                        />
                                    </>
                                );
                            case "editable text":
                                return (
                                    <>
                                        <IconButton
                                            type={isInEditingState ? "check" : "edit"}
                                            disabled={props.isLocked || (isInEditingState && !isValueBeingTypedValid)}
                                            onClick={onSubmitButtonClick}
                                            fontSize="small"
                                        />
                                        <IconButton
                                            type="filterNone"
                                            onClick={onRequestCopy}
                                            fontSize="small"
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
                                        <IconButton
                                            type="filterNone"
                                            onClick={onRequestCopy}
                                            fontSize="small"
                                        />
                                    </>
                                );
                            case "text":
                                return (
                                    <>
                                        <IconButton
                                            type="filterNone"
                                            onClick={onRequestCopy}
                                            fontSize="small"
                                        />
                                        <IconButton
                                            type="filterNone"
                                            onClick={onRequestCopy}
                                            fontSize="small"
                                        />
                                    </>
                                );
                            case "language":
                                return null;
                        }
                    })()}
                </TableCell>
            </TableRow>
            { helperText !== undefined &&
                <TableRow className={cx(className)}>
                    <TableCell className={classNames.helperTextCell}>
                        <Typography> {helperText} </Typography>
                    </TableCell>
                </TableRow>
            }
        </>
    );



});

export declare namespace AccountRow {

    export type I18nScheme = Record<
        Exclude<Props["type"], "text" | "editableText" | "toggle">,
        undefined
    > & {
        's3 script helper text': undefined;
        'service password helper text': undefined;
    };

}