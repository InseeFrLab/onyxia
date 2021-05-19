
export type FormFieldValue = {
    path: string[];
    value: string | boolean;
};

export function formFieldsValueToObject(
    formFieldsValue: Pick<FormFieldValue, "path" | "value">[]
): Record<string, unknown> {
    return [...formFieldsValue]
        .sort(
            (a, b) => JSON.stringify(a.path)
                .localeCompare(JSON.stringify(b.path))
        )
        .reduce<Record<string, unknown>>((launchRequestOptions, formField) => {

            (function callee(
                props: {
                    launchRequestOptions: Record<string, unknown>;
                    formFieldValue: FormFieldValue;
                }
            ): void {

                const { launchRequestOptions, formFieldValue: formField } = props;

                const [key, ...rest] = formField.path

                if (rest.length === 0) {

                    launchRequestOptions[key] = formField.value;

                } else {

                    const launchRequestSubOptions = {};

                    launchRequestOptions[key] = launchRequestSubOptions;

                    callee({
                        "launchRequestOptions": launchRequestSubOptions,
                        "formFieldValue": {
                            "path": rest,
                            "value": formField.value
                        }
                    })

                }

            })({
                launchRequestOptions,
                formFieldValue: formField
            });

            return launchRequestOptions

        }, {});
}

export function objectToFormFieldsValue(
    obj: Record<string, unknown>
): FormFieldValue[] {

    const formFieldsValue: FormFieldValue[] = [];

    (function callee(
        params: {
            obj: Record<string, unknown>;
            currentPath: string[];
        }
    ): void {

        const {
            obj,
            currentPath
        } = params;

        Object.entries(obj).forEach(([key, value]) => {

            const newCurrentPath = [...currentPath, key];

            if (value instanceof Object) {
                callee({
                    "currentPath": newCurrentPath,
                    "obj": value as Record<string, unknown>,
                });
            } else {
                formFieldsValue.push({
                    "path": newCurrentPath,
                    "value": value as FormFieldValue["value"]
                });
            }

        });


    })({
        "currentPath": [],
        obj
    });

    return formFieldsValue

};

