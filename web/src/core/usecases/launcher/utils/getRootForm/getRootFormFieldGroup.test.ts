import { describe, it, expect } from "vitest";
import { getRootFormFieldGroup } from "./getRootFormFieldGroup";
import { symToStr } from "tsafe/symToStr";
import type { FormFieldGroup } from "../../formTypes";

describe(symToStr({ getRootFormFieldGroup }), () => {
    it("simple case", () => {
        const xOnyxiaContext = {
            "r": [1, 2, 3]
        };

        const got = getRootFormFieldGroup({
            "helmValuesSchema": {
                "type": "object",
                "properties": {
                    "a": {
                        "type": "string"
                    },
                    "b": {
                        "type": "number",
                        "x-onyxia": {
                            "overwriteListEnumWith": "r"
                        }
                    }
                }
            },
            "helmValues": {
                "a": "foo",
                "b": 2
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            "type": "group",
            "helmValuesPathSegment": "root",
            "description": undefined,
            "children": [
                {
                    "type": "field",
                    "description": undefined,
                    "pattern": undefined,
                    "title": "a",
                    "isReadonly": false,
                    "fieldType": "text field",
                    "helmValuesPath": ["a"],
                    "doRenderAsTextArea": false,
                    "isSensitive": false,
                    "value": "foo"
                },
                {
                    "type": "field",
                    "description": undefined,
                    "title": "b",
                    "isReadonly": false,
                    "fieldType": "select",
                    "helmValuesPath": ["b"],
                    "options": [1, 2, 3],
                    "selectedOptionIndex": 1
                }
            ],
            "canAdd": false,
            "canRemove": false
        };

        expect(got).toStrictEqual(expected);
    });

    it("with array", () => {
        const xOnyxiaContext = {};

        const got = getRootFormFieldGroup({
            "helmValuesSchema": {
                "type": "object",
                "properties": {
                    "a": {
                        "type": "string"
                    },
                    "b": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "foo": { "type": "string" },
                                "bar": { "type": "number" }
                            }
                        },
                        "minItems": 1
                    }
                }
            },
            "helmValues": {
                "a": "value of a",
                "b": [{ "foo": "value of foo", "bar": 42 }]
            },
            xOnyxiaContext
        });

        const expected: FormFieldGroup = {
            "type": "group",
            "helmValuesPathSegment": "root",
            "description": undefined,
            "children": [
                {
                    "type": "field",
                    "title": "a",
                    "isReadonly": false,
                    "fieldType": "text field",
                    "helmValuesPath": ["a"],
                    "description": undefined,
                    "doRenderAsTextArea": false,
                    "isSensitive": false,
                    "pattern": undefined,
                    "value": "value of a"
                },
                {
                    "type": "group",
                    "helmValuesPathSegment": "b",
                    "description": undefined,
                    "children": [
                        {
                            "type": "group",
                            "helmValuesPathSegment": 0,
                            "description": undefined,
                            "children": [
                                {
                                    "type": "field",
                                    "title": "foo",
                                    "isReadonly": false,
                                    "fieldType": "text field",
                                    "helmValuesPath": ["b", 0, "foo"],
                                    "description": undefined,
                                    "doRenderAsTextArea": false,
                                    "isSensitive": false,
                                    "pattern": undefined,
                                    "value": "value of foo"
                                },
                                {
                                    "type": "field",
                                    "title": "bar",
                                    "isReadonly": false,
                                    "fieldType": "integer field",
                                    "helmValuesPath": ["b", 0, "bar"],
                                    "description": undefined,
                                    "value": 42,
                                    "isInteger": false,
                                    "minimum": undefined
                                }
                            ],
                            "canAdd": false,
                            "canRemove": false
                        }
                    ],
                    "canAdd": true,
                    "canRemove": false
                }
            ],
            "canAdd": false,
            "canRemove": false
        };

        expect(got).toStrictEqual(expected);
    });
});
