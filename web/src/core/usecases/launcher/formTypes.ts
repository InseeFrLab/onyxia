import { assert, type Equals } from "tsafe/assert";
import type { Stringifyable } from "core/tools/Stringifyable";

export type RootForm = {
    main: FormFieldGroup["children"];
    global: FormFieldGroup["children"];
    dependencies: Record<
        string,
        {
            main: FormFieldGroup["children"];
            global: FormFieldGroup["children"];
        }
    >;
    disabledDependencies: string[];
};

export type FormFieldGroup = {
    type: "group";
    helmValuesPathSegment: string | number;
    description: string | undefined;

    children: (FormField | FormFieldGroup)[];
    canAdd: boolean;
    canRemove: boolean;
};

export type FormField =
    | FormField.Checkbox
    | FormField.YamlCodeBlock
    | FormField.NumberField
    | FormField.Select
    | FormField.TextField
    | FormField.Slider
    | FormField.RangeSlider;

export namespace FormField {
    type Common = {
        type: "field";
        title: string;
    };

    export type Checkbox = Common & {
        fieldType: "checkbox";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        value: boolean;
    };

    export type YamlCodeBlock = Common & {
        fieldType: "yaml code block";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        expectedDataType: "object" | "array";
        value: Record<string, Stringifyable> | Stringifyable[];
    };

    export type NumberField = Common & {
        fieldType: "integer field";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        value: number;
        isInteger: boolean;
        minimum: number | undefined;
    };

    export type Select = Common & {
        fieldType: "select";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        options: Stringifyable[];
        selectedOptionIndex: number;
    };

    export type TextField = Common & {
        fieldType: "text field";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        doRenderAsTextArea: boolean;
        isSensitive: boolean;
        pattern: string | undefined;
        value: string;
    };

    export type Slider = Common & {
        fieldType: "slider";
        isReadonly: boolean;
        helmValuesPath: (string | number)[];
        description: string | undefined;
        min: number;
        max: number;
        unit: string | undefined;
        step: number | undefined;
        value: number;
    };

    export type RangeSlider = Common & {
        fieldType: "range slider";
        unit: string | undefined;
        step: number | undefined;
        lowEndRange: RangeSlider.RangeEnd;
        highEndRange: RangeSlider.RangeEnd;
    };

    export namespace RangeSlider {
        export type RangeEnd = {
            isReadonly: boolean;
            helmValuesPath: (string | number)[];
            value: number;
            rangeEndSemantic: string | undefined;
            min: number;
            max: number;
            description: string | undefined;
        };
    }
}

export type FormFieldValue =
    | Pick<FormField.Checkbox, FormFieldValue.Name>
    | Pick<FormField.YamlCodeBlock, FormFieldValue.Name>
    | Pick<FormField.NumberField, FormFieldValue.Name>
    | {
          fieldType: "select";
          helmValuesPath: Pick<FormField.Select, "helmValuesPath">;
          selectedOptionIndex: Pick<FormField.Select, "selectedOptionIndex">;
      }
    | Pick<FormField.TextField, FormFieldValue.Name>
    | Pick<FormField.Slider, FormFieldValue.Name>
    | {
          fieldType: "range slider";
          lowEndRange: Pick<FormField.RangeSlider.RangeEnd, "helmValuesPath" | "value">;
          highEndRange: Pick<FormField.RangeSlider.RangeEnd, "helmValuesPath" | "value">;
      };

export namespace FormFieldValue {
    export type Name = "fieldType" | "helmValuesPath" | "value";
}

assert<Equals<FormFieldValue["fieldType"], FormField["fieldType"]>>(true);