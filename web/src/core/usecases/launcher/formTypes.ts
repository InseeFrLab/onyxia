import type { JSONSchema } from "core/ports/OnyxiaApi/JSONSchema";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import { assert, type Equals } from "tsafe/assert";

export type FormFieldGroup = {
    type: "group";
    helmValuesPath: (string | number)[];
    groupName: string;
    children: (FormField | FormFieldGroup)[];
    canAdd: boolean;
    canRemove: boolean;
};

export type FormField =
    | FormField.Checkbox
    | FormField.YamlCodeBlock
    | FormField.IntegerField
    | FormField.Select
    | FormField.TextField
    | FormField.Slider
    | FormField.RangeSlider;

export namespace FormField {
    type Common = {
        type: "field";
        helmValuePath: (string | number)[];
        title: string;
        description: string | undefined;
    };

    export type Checkbox = Common & {
        fieldType: "checkbox";
        value: boolean;
    };

    export type YamlCodeBlock = Common & {
        fieldType: "yaml code block";
        expectedYamlType: "object" | "array";
        value: string;
        isValid: boolean;
    };

    export type IntegerField = Common & {
        fieldType: "integer field";
        value: number;
        minimum: number | undefined;
    };

    // TODO: What about enums that are not strings?
    export type Select = Common & {
        fieldType: "select";
        enum: string[];
        value: string;
    };

    export type TextField = Common & {
        fieldType: "text field";
        doRenderAsTextArea: boolean;
        isSensitive: boolean;
        pattern: string | undefined;
        value: string;
        doesMatchPattern: boolean;
    };

    export type Slider = Common & {
        fieldType: "slider";
        sliderMax: number;
        sliderMin: number;
        sliderUnit: string;
        sliderStep: number;
        value: number;
    };

    export type RangeSlider = Common & {
        fieldType: "range slider";
        sliderMinSemantic: string;
        sliderMaxSemantic: string;
        sliderMin: number;
        sliderMax: number;
        sliderUnit: string; //Note this is the string in `${number}${string}`
        sliderStep: number;
        value: { from: number; to: number };
    };
}

export type FormFieldValue =
    | Pick<FormField.Checkbox, FormFieldValue.Name>
    | Pick<FormField.YamlCodeBlock, FormFieldValue.Name>
    | Pick<FormField.IntegerField, FormFieldValue.Name>
    | Pick<FormField.Select, FormFieldValue.Name>
    | Pick<FormField.TextField, FormFieldValue.Name>
    | Pick<FormField.Slider, FormFieldValue.Name>
    | Pick<FormField.RangeSlider, FormFieldValue.Name>;

export namespace FormFieldValue {
    export type Name = "fieldType" | "helmValuePath" | "value";
}

assert<Equals<FormFieldValue["fieldType"], FormField["fieldType"]>>(true);

export function getInitialHelmValues(params: {
    helmValuesSchema: JSONSchema;
    xOnyxiaContext: XOnyxiaContext;
}): { helmValues: Record<string, unknown> } {
    return null as any;
}
