


import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { useState, useEffect, useMemo, useReducer, memo } from "react";
import type { ReactNode, RefObject } from "react";
import { useConstCallback } from "powerhooks";
import MuiTextField from "@material-ui/core/TextField";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import { getBrowser } from "app/tools/getBrowser";
import InputAdornment from "@material-ui/core/InputAdornment";
import { IconButton } from "app/components/designSystem/IconButton";
import type { NonPostableEvt } from "evt";
import { useEffectOnValueChange } from "powerhooks";
import { useEvt } from "evt/hooks";
import type { ReturnType } from "evt/tools/typeSafety";
import { CircularProgress } from "./CircularProgress";
import { Tooltip } from "app/components/designSystem/Tooltip";
import { Icon } from "app/components/designSystem/Icon";
import { Typography } from "app/components/designSystem/Typography";

export type TextFieldProps = {
    className?: string | null;
    id?: string | null;
    name?: string | null;
    autoComplete?: "on" | "off";
    type?: "text" | "password" | "email";
    /** Will overwrite value when updated */
    defaultValue?: string;
    inputProps_ref?: RefObject<HTMLInputElement> | null;
    'inputProps_aria-label'?: string | null;
    inputProps_tabIndex?: number | null;
    inputProps_spellCheck?: boolean;
    inputProps_autoFocus?: boolean;
    InputProps_endAdornment?: ReactNode;
    disabled?: boolean;
    multiline?: boolean;
    /** Return false to e.preventDefault() and e.stopPropagation() */
    onEscapeKeyDown?(params: { preventDefaultAndStopPropagation(): void; }): void;
    onEnterKeyDown?(params: { preventDefaultAndStopPropagation(): void; }): void;
    onBlur?(): void;

    /** To prevent onSubmit to be invoked (when data is being updated for example ) default true*/
    isSubmitAllowed?: boolean;
    evtAction?: NonPostableEvt<"TRIGGER SUBMIT" | "RESTORE DEFAULT VALUE"> | null;
    /** Submit invoked on evtAction.post("TRIGGER SUBMIT") only if value being typed is valid */
    onSubmit?(value: string): void;
    getIsValidValue?(value: string): { isValidValue: true } | { isValidValue: false; message: string; };
    /** Invoked on first render */
    onValueBeingTypedChange?(params: { value: string; } & ReturnType<TextFieldProps["getIsValidValue"]>): void;
    transformValueBeingTyped?: (value: string) => string;
    label?: React.ReactNode;
    helperText?: string;
    questionMarkHelperText?: string;
    doOnlyValidateInputAfterFistFocusLost?: boolean
    isCircularProgressShown?: boolean;
    selectAllTextOnFocus?: boolean;
};

export const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    "helperText": "",
    "questionMarkHelperText": "",
    "doOnlyValidateInputAfterFistFocusLost": true,
    "defaultValue": "",
    "className": null,
    "id": null,
    "name": null,
    "autoComplete": "off",
    "type": "text",
    "disabled": false,
    "multiline": false,
    "onEscapeKeyDown": () => { },
    "onEnterKeyDown": () => { },
    "onBlur": () => { },
    "isSubmitAllowed": true,
    "onSubmit": () => { },
    "getIsValidValue": () => ({ "isValidValue": true }),
    "evtAction": null,
    "onValueBeingTypedChange": () => { },
    "transformValueBeingTyped": value => value,
    "isCircularProgressShown": false,
    "selectAllTextOnFocus": false,

    "inputProps_ref": null,
    'inputProps_aria-label': null,
    "inputProps_tabIndex": null,
    "inputProps_spellCheck": true,
    "inputProps_autoFocus": false,
    "InputProps_endAdornment": null

};

const { useClassNames } = createUseClassNames<Required<TextFieldProps> & { error: boolean; }>()(
    (theme, { error }) => ({
        "root": {
            "& .MuiFormHelperText-root": {
                "position": "absolute",
                "bottom": "-25px"
            },
            "& .MuiTypography-caption": {
                "whiteSpace": "nowrap"
            },
            "& .MuiFormLabel-root, & .MuiFormHelperText-root": {
                "color": error ?
                    theme.custom.colors.useCases.alertSeverity.error.main :
                    (() => {
                        switch (theme.palette.type) {
                            case "light": return theme.custom.colors.palette.whiteSnow.greyVariant3
                            case "dark": return theme.custom.colors.palette.midnightBlue.greyVariant2
                        }
                    })()
            },
            "&:focus": {
                "outline": "unset",
            },
            "& input:-webkit-autofill": {
                ...(() => {
                    switch (getBrowser()) {
                        case "chrome":
                        case "safari":
                            return {
                                "WebkitTextFillColor":
                                    theme.palette.text[(() => {
                                        switch (theme.palette.type) {
                                            case "dark": return "primary";
                                            case "light": return "secondary";
                                        }
                                    })()],
                                "WebkitBoxShadow": `0 0 0 1000px ${theme.custom.colors.useCases.surfaces.surface1} inset`,
                            };
                        default: return {}
                    }
                })()
            },
            "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                "borderBottomWidth": 1
            },
            "& .MuiInput-underline:after": {
                "borderBottomWidth": 1
            }

        },
        "helperText": {
            "color": theme.custom.colors.useCases.typography.textDisabled
        },
        "questionMark": {
            "verticalAlign": "middle",
            "color": theme.custom.colors.useCases.typography.textDisabled
        }
    })
);

export const TextField = memo((props: TextFieldProps) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const {
        transformValueBeingTyped,
        defaultValue,
        getIsValidValue,
        doOnlyValidateInputAfterFistFocusLost,
        onValueBeingTypedChange,
        onBlur,
        evtAction,
        onSubmit,
        onEscapeKeyDown,
        onEnterKeyDown,
        className,
        type,
        isCircularProgressShown,
        helperText,
        id,
        name,
        selectAllTextOnFocus,
        isSubmitAllowed,
        inputProps_ref,
        "inputProps_aria-label": inputProps_ariaLabel,
        inputProps_tabIndex,
        inputProps_spellCheck,
        inputProps_autoFocus,
        InputProps_endAdornment,
        questionMarkHelperText,
        ...completedPropsRest
    } = completedProps;

    const inputProps = useMemo(
        () => ({
            "ref": inputProps_ref ?? undefined,
            "aria-label": inputProps_ariaLabel ?? undefined,
            "tabIndex": inputProps_tabIndex ?? undefined,
            "spellCheck": inputProps_spellCheck,
            "autoFocus": inputProps_autoFocus
        }),
        [
            inputProps_ref, inputProps_ariaLabel, inputProps_tabIndex,
            inputProps_spellCheck, inputProps_autoFocus
        ]
    );

    const { value, transformAndSetValue } = (function useClosure() {

        const [value, setValue] = useState(defaultValue);

        const transformAndSetValue = useConstCallback(
            (value: string) => {

                if (!isValidationEnabled && !doOnlyValidateInputAfterFistFocusLost) {
                    enableValidation();
                }

                setValue(transformValueBeingTyped(value));
            }
        );

        return { value, transformAndSetValue };

    })();

    useEffectOnValueChange(
        () => transformAndSetValue(defaultValue),
        [defaultValue]
    );

    const getIsValidValueResult = useMemo(
        () => getIsValidValue(value),
        [value, getIsValidValue]
    );

    useEffect(
        () => {
            onValueBeingTypedChange({ value, ...getIsValidValueResult });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    );


    const [isValidationEnabled, enableValidation] = useReducer(
        () => true,
        false
    );

    useEvt(
        ctx => evtAction?.attach(
            ctx,
            action => {
                switch (action) {
                    case "RESTORE DEFAULT VALUE":
                        transformAndSetValue(defaultValue);
                        return;
                    case "TRIGGER SUBMIT":
                        if (
                            !getIsValidValueResult.isValidValue ||
                            !isSubmitAllowed
                        ) return;
                        onSubmit(value);
                        return;
                }
            }
        ),
        [
            defaultValue, value, getIsValidValueResult,
            onSubmit, evtAction, transformAndSetValue,
            isSubmitAllowed
        ]
    );

    const error = isValidationEnabled ? !getIsValidValueResult.isValidValue : false;

    const { classNames } = useClassNames({
        ...completedProps,
        error
    });

    const [isPasswordShown, toggleIsPasswordShown] = useReducer((v: boolean) => !v, false);

    const onKeyDown = useConstCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLDivElement>) => {

            const key = (() => {
                switch (event.key) {
                    case "Escape":
                    case "Enter":
                        return event.key;
                    default: return "irrelevant";
                }
            })();

            if (key === "irrelevant") {
                return;
            }

            const preventDefaultAndStopPropagation = () => {
                event.preventDefault();
                event.stopPropagation();
            };

            switch (key) {
                case "Escape":
                    onEscapeKeyDown({ preventDefaultAndStopPropagation });
                    break;
                case "Enter":
                    onEnterKeyDown({ preventDefaultAndStopPropagation });
                    break;
            }

        }
    );

    const InputProps = useMemo(
        () => ({
            "endAdornment":
                InputProps_endAdornment ??
                    isCircularProgressShown ?
                    <InputAdornment position="end">
                        <CircularProgress color="textPrimary" size={10} />
                    </InputAdornment> :
                    type === "password" ?
                        <InputAdornment position="end">
                            <IconButton
                                type={isPasswordShown ? "visibilityOff" : "visibility"}
                                onClick={toggleIsPasswordShown}
                            />
                        </InputAdornment> :
                        undefined,
        }),
        [isPasswordShown, type, InputProps_endAdornment, isCircularProgressShown]
    );

    return (
        <MuiTextField
            type={type !== "password" ? type : isPasswordShown ? "text" : "password"}
            className={cx(classNames.root, className)}
            value={value}
            error={error}
            helperText={
                <>
                    <Typography
                        className={classNames.helperText}
                        variant="caption"
                    >
                        {
                            isValidationEnabled && !getIsValidValueResult.isValidValue ?
                                getIsValidValueResult.message || helperText :
                                helperText
                        }
                    </Typography>
                    {questionMarkHelperText !== "" &&
                        <>
                            &nbsp;
                            <Tooltip title={questionMarkHelperText}>
                                <Icon
                                    className={classNames.questionMark}
                                    type="help"
                                    fontSize="small"
                                />
                            </Tooltip>
                        </>}
                </>
            }
            InputProps={InputProps}
            onBlur={useConstCallback(() => {
                if (!isValidationEnabled) enableValidation();
                onBlur();
            })}
            onChange={useConstCallback(
                ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    transformAndSetValue(target.value)
            )}
            onKeyDown={onKeyDown}
            onFocus={useConstCallback(
                ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    if (!selectAllTextOnFocus) return;
                    target.setSelectionRange(0, target.value.length);
                }
            )}
            id={id ?? undefined}
            name={name ?? undefined}
            inputProps={inputProps}
            {...completedPropsRest}
        />
    );


});
