import { it, expect, describe } from "vitest";
import {
    removeFormFieldGroupWithNoNodes,
    type FormFieldGroupLike
} from "./removeFormFieldGroupWithNoNodes";
import structuredClone from "@ungap/structured-clone";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ removeFormFieldGroupWithNoNodes }), () => {
    it("simple case", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "nodes": []
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            "nodes": got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("more than one removal", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "nodes": []
            },
            {
                "type": "field"
            },
            {
                "type": "group",
                "nodes": []
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            "nodes": got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("nested case", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                "type": "group",
                "nodes": [
                    {
                        "type": "group",
                        "nodes": []
                    },
                    {
                        "type": "group",
                        "nodes": []
                    }
                ]
            },
            {
                "type": "field"
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            "nodes": got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("case nothing to remove", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                "type": "field"
            },
            {
                "type": "group",
                "nodes": [
                    {
                        "type": "group",
                        "nodes": [
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

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            "nodes": got
        });

        const expected = nodes;

        expect(got).toStrictEqual(expected);
    });
});
