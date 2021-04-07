


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

export type TextFieldProps = {
    className?: string | null;
    id?: string | null;
    name?: string | null;
    autoComplete?: "on" | "off";
    type?: "text" | "password";
    /** Will overwrite value when updated */
    defaultValue?: string;
    inputProps?: {
        ref?: RefObject<HTMLInputElement>;
        'aria-label'?: string;
        tabIndex?: number;
        spellCheck?: boolean;
        autoFocus?: boolean;
    };
    InputProps?: {
        endAdornment?: ReactNode;
    };
    color?: "primary" | "secondary";
    disabled?: boolean;
    multiline?: boolean;

    /** Return false to e.preventDefault() and e.stopPropagation() */
    onEscapeKeyDown?(params: { preventDefaultAndStopPropagation(): void; }): void;
    onEnterKeyDown?(params: { preventDefaultAndStopPropagation(): void; }): void;
    onBlur?(): void;
    evtAction?: NonPostableEvt<"TRIGGER SUBMIT" | "RESTORE DEFAULT VALUE"> | null;
    onSubmit?(params: { value: string; isValidValue: boolean; }): void;
    getIsValidValue?(value: string): { isValidValue: true } | { isValidValue: false; message: string; };
    /** Invoked on first render */
    onValueBeingTypedChange?(params: { value: string; } & ReturnType<TextFieldProps["getIsValidValue"]>): void;
    transformValueBeingTyped?: (value: string) => string;
    label?: React.ReactNode;
    helperText?: string;
    doOnlyValidateInputAfterFistFocusLost?: boolean
    isCircularProgressShown?: boolean;
    selectAllTextOnFocus?: boolean;
};

export const defaultProps: Optional<TextFieldProps> = {
    "label": null,
    "helperText": "",
    "doOnlyValidateInputAfterFistFocusLost": true,
    "defaultValue": "",
    "className": null,
    "id": null,
    "name": null,
    "autoComplete": "off",
    "type": "text",
    "color": "primary",
    "disabled": false,
    "multiline": false,
    "inputProps": {},
    "InputProps": {},
    "onEscapeKeyDown": () => { },
    "onEnterKeyDown": () => { },
    "onBlur": () => { },
    "onSubmit": () => { },
    "getIsValidValue": () => ({ "isValidValue": true }),
    "evtAction": null,
    "onValueBeingTypedChange": () => { },
    "transformValueBeingTyped": value => value,
    "isCircularProgressShown": false,
    "selectAllTextOnFocus": false

};

const { useClassNames } = createUseClassNames<Required<TextFieldProps> & { error: boolean; }>()(
    (theme, { error: _error }) => ({
        "root": {
            "& .MuiFormHelperText-root": {
                "position": "absolute",
                "bottom": "-20px"
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
                                "WebkitBoxShadow": `0 0 0 1000px ${theme.custom.colors.useCases.surfaces.surfaces} inset`,
                            };
                        default: return {}
                    }

                })()


            }

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
        InputProps: { endAdornment, ...InputProps },
        isCircularProgressShown,
        helperText,
        id,
        name,
        selectAllTextOnFocus,
        ...completedPropsRest
    } = completedProps;

    const { value, transformAndSetValue } = (function useClosure(
        transformValueBeingTyped: typeof completedProps["transformValueBeingTyped"]
    ) {

        const [value, setValue] = useState(defaultValue);

        const transformAndSetValue = useConstCallback(
            (value: string) => setValue(
                transformValueBeingTyped(value)
            )
        );

        return { value, transformAndSetValue };

    })(transformValueBeingTyped);

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
        !doOnlyValidateInputAfterFistFocusLost
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
                        onSubmit({ value, "isValidValue": getIsValidValueResult.isValidValue });
                        return;
                }
            }
        ),
        [defaultValue, value, getIsValidValueResult, onSubmit, evtAction, transformAndSetValue]
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

    return (
        <MuiTextField
            type={type !== "password" ? type : isPasswordShown ? "text" : "password"}
            className={cx(classNames.root, className)}
            value={value}
            error={error}
            helperText={
                isValidationEnabled && !getIsValidValueResult.isValidValue ?
                    getIsValidValueResult.message :
                    helperText
            }
            InputProps={useMemo(
                () => ({
                    "endAdornment":
                        endAdornment ??
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
                    ...InputProps
                }),
                [isPasswordShown, type, InputProps, endAdornment, isCircularProgressShown]
            )}
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
            {...completedPropsRest}
        />
    );


});
