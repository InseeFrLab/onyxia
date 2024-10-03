import { useEffect, useState } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useConst } from "powerhooks/useConst";
import { waitForDebounceFactory } from "powerhooks/tools/waitForDebounce";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

export function useFormField<
    TValue,
    TSerializedValue extends string | number | boolean,
    ErrorMessageKey extends string
>(params: {
    serializedValue: TSerializedValue;
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
    resetToDefault: () => void;
} {
    const { serializedValue: serializedValue_params, onChange, parse } = params;

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

    const onChangeWithDebounce = useConst(() => {
        const { waitForDebounce } = waitForDebounceFactory({ "delay": 500 });

        async function onChangeWithDebounce(newValue: TValue) {
            await waitForDebounce();

            onChange_const(newValue);
        }

        return onChangeWithDebounce;
    });

    useEffect(() => {
        const resultOfParse = parse(serializedValue);

        if (!resultOfParse.isValid) {
            setErrorMessageKey(resultOfParse.errorMessageKey);
            return;
        }

        setErrorMessageKey(undefined);

        onChangeWithDebounce(resultOfParse.value);
    }, [serializedValue]);

    return {
        serializedValue,
        setSerializedValue,
        errorMessageKey,
        "resetToDefault": () => setSerializedValue(serializedValue_default)
    };
}