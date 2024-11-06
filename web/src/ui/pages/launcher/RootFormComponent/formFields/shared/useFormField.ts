import { useEffect, useState } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useConst } from "powerhooks/useConst";
import { createWaitForThrottle } from "ui/tools/waitForThrottle";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

export function useFormField<
    TValue,
    TSerializedValue extends string | number | boolean,
    ErrorMessageKey extends string
>(params: {
    serializedValue: TSerializedValue;
    throttleDelay: number;
    onChange: (newValue: TValue) => void;
    parse: (
        serializedValue: TSerializedValue
    ) =>
        | { isValid: true; value: TValue }
        | { isValid: false; errorMessageKey: ErrorMessageKey };
}): {
    serializedValue: TSerializedValue;
    setSerializedValue: (newValue: TSerializedValue) => void;
    errorMessageKey: ErrorMessageKey | undefined;
    resetToDefault: (() => void) | undefined;
} {
    const {
        serializedValue: serializedValue_params,
        throttleDelay,
        onChange,
        parse
    } = params;

    const serializedValue_default = useConst(() => serializedValue_params);

    const [serializedValue, setSerializedValue] = useState(serializedValue_params);
    const [errorMessageKey, setErrorMessageKey] = useState<ErrorMessageKey | undefined>(
        undefined
    );

    useEffect(() => {
        if (serializedValue_params === serializedValue) {
            return;
        }

        const resultOfParse_params = parse(serializedValue_params);

        assert(resultOfParse_params.isValid);

        const resultOfParse = parse(serializedValue);

        if (
            resultOfParse.isValid &&
            same(resultOfParse.value, resultOfParse_params.value)
        ) {
            return;
        }

        setSerializedValue(serializedValue_params);
    }, [serializedValue_params]);

    const onChange_const = useConstCallback(onChange);

    const { onChangeWithThrottle, cancelThrottle } = useConst(() => {
        const { waitForThrottle, cancelThrottle } = createWaitForThrottle({
            delay: throttleDelay
        });

        async function onChangeWithThrottle(newValue: TValue) {
            await waitForThrottle();

            onChange_const(newValue);
        }

        return { onChangeWithThrottle, cancelThrottle };
    });

    useEffect(() => {
        const resultOfParse = parse(serializedValue);

        if (!resultOfParse.isValid) {
            cancelThrottle();
            setErrorMessageKey(resultOfParse.errorMessageKey);
            return;
        }

        setErrorMessageKey(undefined);

        onChangeWithThrottle(resultOfParse.value);
    }, [serializedValue]);

    return {
        serializedValue,
        setSerializedValue,
        errorMessageKey,
        resetToDefault:
            serializedValue === serializedValue_default
                ? undefined
                : () => setSerializedValue(serializedValue_default)
    };
}
