export type FormFieldValue = {
    path: string[];
    value: string | boolean | number | Record<string, any>;
};

/**
 *
 * in:  [{ "path": ["a", "b"], "value": 32 }, { "path": ["a", "c"], "value": 33 }]
 * out: { "a": { "b": 32, "c": 33 } }
 *
 *
 */
export function formFieldsValueToObject(
    formFieldsValue: FormFieldValue[],
): Record<string, unknown> {
    return [...formFieldsValue]
        .sort((a, b) => JSON.stringify(a.path).localeCompare(JSON.stringify(b.path)))
        .reduce<Record<string, unknown>>((launchRequestOptions, formFieldValue) => {
            (function callee(props: {
                launchRequestOptions: Record<string, unknown>;
                formFieldValue: FormFieldValue;
            }): void {
                const { launchRequestOptions, formFieldValue } = props;

                const [key, ...rest] = formFieldValue.path;

                if (rest.length === 0) {
                    launchRequestOptions[key] = formFieldValue.value;
                } else {
                    callee({
                        //"launchRequestOptions": launchRequestOptions[key] ??= {} as any,
                        "launchRequestOptions":
                            launchRequestOptions[key] ??
                            (launchRequestOptions[key] = {} as any),
                        "formFieldValue": {
                            "path": rest,
                            "value": formFieldValue.value,
                        },
                    });
                }
            })({
                launchRequestOptions,
                formFieldValue,
            });

            return launchRequestOptions;
        }, {});
}
