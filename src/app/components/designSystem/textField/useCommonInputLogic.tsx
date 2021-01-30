

import { useState, useEffect } from "react";
import { useCallback } from "app/tools/hooks/useCallbackFactory";
import { id } from "evt/tools/typeSafety/id";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { useValueChangeEffect } from "app/tools/hooks/useValueChangeEffect";

export type Props = {
    className?: string | null;
    /** Will overwrite value when updated */
    defaultValue: string;
    inputProps: { 'aria-label': string; };
    autoFocus?: boolean;
    color?: "primary" | "secondary" | null;
    disabled?: boolean;
    multiline?: boolean;
    onEscapeKeyDown?: () => void;
    onEnterKeyDown?: () => void;
    onBlur?: () => void;
    evtAction: NonPostableEvt<"TRIGGER SUBMIT" | "RESTORE DEFAULT VALUE">;
    onSubmit(params: { value: string; isValidValue: boolean; }): void;
    getIsValidValue(value: string): { isValidValue: true } | { isValidValue: false; message: string; };
    /** Invoked on first render */
    onValueBeingTypedChange?: (params: { value: string; } & ReturnType<Props["getIsValidValue"]>) => void;
    transformValueBeingTyped?: (value: string) => string;
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "autoFocus": false,
    "color": null,
    "disabled": false,
    "multiline": false,
    "onEscapeKeyDown": () => { },
    "onEnterKeyDown": () => { },
    "onBlur": () => { },
    "onValueBeingTypedChange": () => { },
    "transformValueBeingTyped": id,
};

export function useCommonInputLogic(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const {
        className,
        defaultValue,
        inputProps,
        autoFocus,
        color,
        disabled,
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
        transformValueBeingTyped: NonNullable<Props["transformValueBeingTyped"]>
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
        () => getIsValidValue(value).isValidValue
    );

    useEffect(
        () => {
            const getIsValidValueResult = getIsValidValue(value);
            setIsValidValue(getIsValidValueResult.isValidValue);
            onValueBeingTypedChange({ value, ...getIsValidValueResult });
        },
        [value, getIsValidValue, onValueBeingTypedChange]
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

            event.preventDefault();

            switch (key) {
                case "Escape": onEscapeKeyDown(); return;
                case "Enter": onEnterKeyDown(); return;
            }

        },
        [onEscapeKeyDown, onEnterKeyDown]
    );

    return {
        "className": className ?? undefined,
        inputProps,
        autoFocus,
        "color": color ?? undefined,
        disabled,
        multiline,
        "error": !isValidValue,
        onChange,
        onFocus,
        onKeyDown,
        onBlur,
        value
    };


}

