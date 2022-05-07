export type JSONSchemaObject = {
    description?: string;
    properties: Record<string, JSONSchemaObject | JSONSchemaFormFieldDescription>;
    type: "object";
};

export type JSONSchemaFormFieldDescription =
    | JSONSchemaFormFieldDescription.String
    | JSONSchemaFormFieldDescription.Boolean
    | JSONSchemaFormFieldDescription.Integer
    | JSONSchemaFormFieldDescription.Object;
export namespace JSONSchemaFormFieldDescription {
    type Common<T> = {
        description?: string;
        title?: string;
        default?: T;
        "x-form"?: {
            hidden?: boolean;
            readonly?: boolean;
            value?: T;
        };
        hidden?:
            | boolean
            | {
                  value: string | boolean | number;
                  path: string;
              };
    };

    export type Boolean = Common<boolean> & {
        type: "boolean";
    };

    export type Integer = Common<number> & {
        type: "integer" | "number";
        minimum?: number;
    };

    export type String = String.Text | String.Enum | String.Slider;
    export namespace String {
        export type Text = Common<string> & {
            type: "string";
            pattern?: string;
            render?: "textArea";
            //NOTE: Only for init.personalInit
            "x-security"?: {
                pattern: string;
            };
        };

        export type Enum<T extends string = string> = Common<T> & {
            type: "string";
            enum: T[];
        };

        export type Slider = Slider.Simple | Slider.Range;
        export namespace Slider {
            type SliderCommon<Unit extends string> = Common<`${number}${Unit}`> & {
                type: "string";
                render: "slider";
            };

            export type Simple<Unit extends string = string> = SliderCommon<Unit> & {
                sliderMax: number;
                sliderMin: number;
                sliderUnit: Unit;
                sliderStep: number;
            };

            export type Range = Range.Down | Range.Up;
            export namespace Range {
                type RangeCommon<Unit extends string> = SliderCommon<Unit> & {
                    sliderExtremitySemantic: string;
                    sliderRangeId: string;
                };

                export type Down<Unit extends string = string> = RangeCommon<Unit> & {
                    sliderExtremity: "down";
                    sliderMin: number;
                    sliderUnit: Unit;
                    sliderStep: number;
                    title: string;
                };

                export type Up<Unit extends string = string> = RangeCommon<Unit> & {
                    sliderExtremity: "up";
                    sliderMax: number;
                };
            }
        }
    }

    export type Object = Common<Record<string, any>> & {
        type: "object";
    };
}
