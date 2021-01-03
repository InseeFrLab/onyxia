
import { useCallback, useState, useEffect } from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiInput from "@material-ui/core/Input";
import { InputClassKey } from "@material-ui/core/Input";
import { id } from "evt/tools/typeSafety/id";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useValueChangeEffect } from "app/utils/hooks/useValueChangeEffect";
import { CircularProgress } from "./CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";

export type InputProps = {
    className?: string | null;
    /** Will overwrite value when updated */
    defaultValue: string;
    inputProps: { 'aria-label': string; };
    autoFocus?: boolean;
    color?: "primary" | "secondary" | null;
    disabled?: boolean;
    isCircularProgressShown?: boolean;
    multiline?: boolean;
    onEscapeKeyDown?: () => void;
    onEnterKeyDown?: () => void;
    onBlur?: () => void;
    evtAction: NonPostableEvt<"TRIGGER SUBMIT" | "RESTORE DEFAULT VALUE">;
    onSubmit(params: { value: string; isValidValue: boolean; }): void;
    getIsValidValue(value: string): boolean;
    /** Invoked on first render */
    onValueBeingTypedChange?: (params: { value: string; isValidValue: boolean; }) => void;
    transformValueBeingTyped?: (value: string) => string;
};

const defaultProps: Optional<InputProps> = {
    "className": null,
    "autoFocus": false,
    "color": null,
    "disabled": false,
    "isCircularProgressShown": false,
    "multiline": false,
    "onEscapeKeyDown": () => { },
    "onEnterKeyDown": () => { },
    "onBlur": () => { },
    "onValueBeingTypedChange": () => { },
    "transformValueBeingTyped": id
};

const useStyles = makeStyles(
    () => createStyles<Id<InputClassKey, "root">, Required<InputProps>>({
        "root": {
        }
    })
);

export function Input(props: InputProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const classes = useStyles(completedProps);

    const {
        className,
        defaultValue,
        inputProps,
        autoFocus,
        color,
        disabled,
        isCircularProgressShown,
        multiline,
        onEscapeKeyDown,
        onEnterKeyDown,
        onBlur,
        evtAction,
        onSubmit,
        getIsValidValue,
        onValueBeingTypedChange,
        transformValueBeingTyped
    } = completedProps;

    const { value, transformAndSetValue } = (function useClosure(
        transformValueBeingTyped: NonNullable<InputProps["transformValueBeingTyped"]>
    ) {

        const [value, setValue] = useState(defaultValue);

        const transformAndSetValue = useCallback(
            (value: string) => setValue(
                transformValueBeingTyped(value)
            ),
            [transformValueBeingTyped]
        );

        return { value, transformAndSetValue };

    })(transformValueBeingTyped);

    useValueChangeEffect(
        () => transformAndSetValue(defaultValue),
        [defaultValue]
    );

    const [isValidValue, setIsValidValue] = useState(
        () => getIsValidValue(value)
    );


    useEvt(
        ctx => evtAction.attach(
            ctx,
            action => {
                switch (action) {
                    case "RESTORE DEFAULT VALUE":
                        transformAndSetValue(defaultValue);
                        return;
                    case "TRIGGER SUBMIT":
                        onSubmit({ value, isValidValue });
                        return;
                }
            }
        ),
        [defaultValue, value, isValidValue, onSubmit, evtAction, transformAndSetValue]
    );

    useEffect(
        () => {
            const isValidValue = getIsValidValue(value);
            setIsValidValue(isValidValue);
            onValueBeingTypedChange({ value, isValidValue });
        },
        [value, getIsValidValue, onValueBeingTypedChange]
    );

    const onChange = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            transformAndSetValue(target.value),
        [transformAndSetValue]
    );

    const onFocus = useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            target.setSelectionRange(0, target.value.length),
        []
    );

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {

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

            event.preventDefault();

            switch (key) {
                case "Escape": onEscapeKeyDown(); return;
                case "Enter": onEnterKeyDown(); return;
            }

        },
        [onEscapeKeyDown, onEnterKeyDown]
    );

    return (
        <MuiInput
            className={className ?? undefined}
            classes={classes}
            inputProps={inputProps}
            autoFocus={autoFocus}
            color={color ?? undefined}
            disabled={disabled}
            endAdornment={
                !isCircularProgressShown ? undefined :
                    <InputAdornment position="end">
                        <CircularProgress color="textPrimary" size={10} />
                    </InputAdornment>
            }
            multiline={multiline}
            error={!isValidValue}
            onChange={onChange}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            value={value}
        />
    );

}
