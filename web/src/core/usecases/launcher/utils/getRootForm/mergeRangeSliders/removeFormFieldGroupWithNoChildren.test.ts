import { it, expect, describe } from "vitest";
import {
    removeFormFieldGroupWithNoChildren,
    type FormFieldGroupLike
} from "./removeFormFieldGroupWithNoChildren";
import structuredClone from "@ungap/structured-clone";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ removeFormFieldGroupWithNoChildren }), () => {
    it("simple case", () => {
        const children: FormFieldGroupLike["children"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "children": []
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("more than one removal", () => {
        const children: FormFieldGroupLike["children"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "children": []
            },
            {
                "type": "field"
            },
            {
                "type": "group",
                "children": []
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("nested case", () => {
        const children: FormFieldGroupLike["children"] = [
            {
                "type": "group",
                "children": [
                    {
                        "type": "group",
                        "children": []
                    },
                    {
                        "type": "group",
                        "children": []
                    }
                ]
            },
            {
                "type": "field"
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children.filter(child => child.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("case nothing to remove", () => {
        const children: FormFieldGroupLike["children"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "children": [
                    {
                        "type": "group",
                        "children": [
                            {
                                "type": "field"
                            }
                        ]
                    },
                    {
                        "type": "field"
                    }
                ]
            }
        ];

        const got = structuredClone(children);

        removeFormFieldGroupWithNoChildren({
            "children": got
        });

        const expected = children;

        expect(got).toStrictEqual(expected);
    });
});
