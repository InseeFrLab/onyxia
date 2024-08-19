import { it, expect, describe } from "vitest";
import { removeFormFieldGroupWithNoChildren } from "./removeFormFieldGroupWithNoChildren";
import type { FormFieldGroup } from "core/usecases/launcher/formTypes";
import structuredClone from "@ungap/structured-clone";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ removeFormFieldGroupWithNoChildren }), () => {
    it("simple case", () => {
        const children: FormFieldGroup["children"] = [
            {
                "type": "field",
                "title": "field 1",
                "fieldType": "checkbox",
                "helmValuesPath": ["root", "field1"],
                "description": undefined,
                "value": true
            },
            {
                "type": "group",
                "helmValuesPathSegment": "group1",
                "description": undefined,
                "children": [],
                "canAdd": false,
                "canRemove": false
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toEqual(expected);
    });

    it("more than one removal", () => {
        const children: FormFieldGroup["children"] = [
            {
                "type": "field",
                "title": "field 1",
                "fieldType": "checkbox",
                "helmValuesPath": ["root", "field1"],
                "description": undefined,
                "value": true
            },
            {
                "type": "group",
                "helmValuesPathSegment": "group1",
                "description": undefined,
                "children": [],
                "canAdd": false,
                "canRemove": false
            },
            {
                "type": "field",
                "title": "field 2",
                "fieldType": "checkbox",
                "helmValuesPath": ["root", "field2"],
                "description": undefined,
                "value": false
            },
            {
                "type": "group",
                "helmValuesPathSegment": "group2",
                "description": undefined,
                "children": [],
                "canAdd": false,
                "canRemove": false
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toEqual(expected);
    });

    it("nested case", () => {
        const children: FormFieldGroup["children"] = [
            {
                "type": "field",
                "title": "field 1",
                "fieldType": "checkbox",
                "helmValuesPath": ["root", "field1"],
                "description": undefined,
                "value": true
            },
            {
                "type": "group",
                "helmValuesPathSegment": "group1",
                "description": undefined,
                "children": [
                    {
                        "type": "group",
                        "helmValuesPathSegment": "group1.1",
                        "description": undefined,
                        "children": [],
                        "canAdd": false,
                        "canRemove": false
                    },
                    {
                        "type": "group",
                        "helmValuesPathSegment": "group1.2",
                        "description": undefined,
                        "children": [],
                        "canAdd": false,
                        "canRemove": false
                    }
                ],
                "canAdd": false,
                "canRemove": false
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toEqual(expected);
    });

    it("case nothing to remove", () => {
        const children: FormFieldGroup["children"] = [
            {
                "type": "field",
                "title": "field 1",
                "fieldType": "checkbox",
                "helmValuesPath": ["root", "field1"],
                "description": undefined,
                "value": true
            },
            {
                "type": "group",
                "helmValuesPathSegment": "group1",
                "description": undefined,
                "children": [
                    {
                        "type": "group",
                        "helmValuesPathSegment": "group1.1",
                        "description": undefined,
                        "children": [
                            {
                                "type": "field",
                                "title": "field 1.1.1",
                                "fieldType": "checkbox",
                                "helmValuesPath": [
                                    "root",
                                    "group1",
                                    "group1.1",
                                    "field1.1.1"
                                ],
                                "description": undefined,
                                "value": true
                            }
                        ],
                        "canAdd": false,
                        "canRemove": false
                    },
                    {
                        "type": "field",
                        "title": "field 1.1",
                        "fieldType": "checkbox",
                        "helmValuesPath": ["root", "group1", "field1.1"],
                        "description": undefined,
                        "value": true
                    }
                ],
                "canAdd": false,
                "canRemove": false
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children;

        expect(got).toEqual(expected);
    });
});
