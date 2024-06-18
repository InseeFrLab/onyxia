import * as yaml from "yaml";
import { assert } from "tsafe/assert";

export type FormField =
    | FormField.Boolean
    | FormField.Object
    | FormField.Array
    | FormField.Integer
    | FormField.Enum
    | FormField.Text
    | FormField.Slider;
export declare namespace FormField {
    type Common = {
        path: string[];
        title: string;
        description: string | undefined;
        isReadonly: boolean;
    };

    export type Boolean = Common & {
        type: "boolean";
        value: boolean;
    };

    export type Object = Common & {
        type: "object";
        value: FormFieldValue.Value.Yaml;
        defaultValue: FormFieldValue.Value.Yaml;
    };

    export type Array = Common & {
        type: "array";
        value: FormFieldValue.Value.Yaml;
        defaultValue: FormFieldValue.Value.Yaml;
    };

    export type Integer = Common & {
        type: "integer";
        value: number;
        minimum: number | undefined;
    };

    export type Enum<T extends string = string> = Common & {
        type: "enum";
        enum: T[];
        value: T;
    };

    export type Text = Common & {
        type: "text" | "password";
        pattern: string | undefined;
        value: string;
        defaultValue: string;
        doRenderAsTextArea: boolean;
    };

    export type Slider = Slider.Simple | Slider.Range;

    export namespace Slider {
        type SliderCommon<Unit extends string> = Common & {
            type: "slider";
            value: `${number}${Unit}`;
        };

        export type Simple<Unit extends string = string> = SliderCommon<Unit> & {
            sliderVariation: "simple";
            sliderMax: number;
            sliderMin: number;
            sliderUnit: Unit;
            sliderStep: number;
        };

        export type Range = Range.Down | Range.Up;
        export namespace Range {
            type RangeCommon<Unit extends string> = SliderCommon<Unit> & {
                sliderVariation: "range";
                sliderExtremitySemantic: string;
                sliderRangeId: string;
            };

            export type Down<Unit extends string = string> = RangeCommon<Unit> & {
                sliderExtremity: "down";
                sliderMin: number;
                sliderUnit: Unit;
                sliderStep: number;
            };

            export type Up<Unit extends string = string> = RangeCommon<Unit> & {
                sliderExtremity: "up";
                sliderMax: number;
            };
        }
    }
}

export type FormFieldValue = {
    path: string[];
    value: FormFieldValue.Value;
};

export namespace FormFieldValue {
    export type Value = string | boolean | number | Value.Yaml;

    export namespace Value {
        export type Yaml = {
            type: "yaml";
            yamlStr: string;
        };
    }
}

export type IndexedFormFields = IndexedFormFields.Final;

export declare namespace IndexedFormFields {
    type Generic<T> = {
        [dependencyNamePackageNameOrGlobal: string]: {
            meta:
                | {
                      type: "dependency";
                  }
                | {
                      type: "package";
                  }
                | {
                      type: "global";
                      description?: string;
                  };
            formFieldsByTabName: {
                [tabName: string]: { description?: string } & T;
            };
        };
    };

    export type Final = Generic<{
        formFields: Exclude<FormField, FormField.Slider.Range>[];
        assembledSliderRangeFormFields: AssembledSliderRangeFormField[];
    }>;

    export type Scaffolding = Generic<{
        formFields: FormField[];
    }>;

    export type AssembledSliderRangeFormField<Unit extends string = string> = {
        title: string;
        description?: string;
        sliderMax: number;
        sliderMin: number;
        sliderUnit: Unit;
        sliderStep: number;
        extremities: Record<
            "up" | "down",
            {
                path: string[];
                semantic: string;
                value: `${number}${Unit}`;
            }
        >;
    };
}

/**
 *
 * in:  [{ "path": ["a", "b"], "value": 32 }, { "path": ["a", "c"], "value": 33 }]
 * out: { "a": { "b": 32, "c": 33 } }
 *
 *
 */
export function formFieldsValueToObject(
    formFieldsValue: FormFieldValue[]
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
                    launchRequestOptions[key] = (() => {
                        const { value } = formFieldValue;

                        if (typeof value === "object") {
                            assert(value.type === "yaml");

                            try {
                                return yaml.parse(value.yamlStr);
                            } catch {
                                return { "message": "parse error" };
                            }
                        }

                        return value;
                    })();
                } else {
                    callee({
                        //"launchRequestOptions": launchRequestOptions[key] ??= {} as any,
                        "launchRequestOptions":
                            launchRequestOptions[key] ??
                            (launchRequestOptions[key] = {} as any),
                        "formFieldValue": {
                            "path": rest,
                            "value": formFieldValue.value
                        }
                    });
                }
            })({
                launchRequestOptions,
                formFieldValue
            });

            return launchRequestOptions;
        }, {});
}
