export type FormFieldValue = {
    path: string[];
    value: string | boolean | number;
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
        .reduce<Record<string, unknown>>((launchRequestOptions, formField) => {
            (function callee(props: {
                launchRequestOptions: Record<string, unknown>;
                formFieldValue: FormFieldValue;
            }): void {
                const { launchRequestOptions, formFieldValue: formField } = props;

                const [key, ...rest] = formField.path;

                if (rest.length === 0) {
                    launchRequestOptions[key] = formField.value;
                } else {
                    callee({
                        //"launchRequestOptions": launchRequestOptions[key] ??= {} as any,
                        "launchRequestOptions":
                            launchRequestOptions[key] ??
                            (launchRequestOptions[key] = {} as any),
                        "formFieldValue": {
                            "path": rest,
                            "value": formField.value,
                        },
                    });
                }
            })({
                launchRequestOptions,
                formFieldValue: formField,
            });

            return launchRequestOptions;
        }, {});
}
