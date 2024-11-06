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
                type: "field"
            },
            {
                type: "group",
                nodes: [],
                canAdd: false
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            nodes: got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("doesn't remove empty arrays", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                type: "field"
            },
            {
                type: "group",
                nodes: [],
                canAdd: true
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            nodes: got
        });

        const expected = nodes;

        expect(got).toStrictEqual(expected);
    });

    it("more than one removal", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                type: "field"
            },
            {
                type: "group",
                nodes: [],
                canAdd: false
            },
            {
                type: "field"
            },
            {
                type: "group",
                nodes: [],
                canAdd: false
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            nodes: got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("nested case", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                type: "group",
                nodes: [
                    {
                        type: "group",
                        nodes: [],
                        canAdd: false
                    },
                    {
                        type: "group",
                        nodes: [],
                        canAdd: false
                    }
                ],
                canAdd: false
            },
            {
                type: "field"
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            nodes: got
        });

        const expected = nodes.filter(node => node.type === "field");

        expect(got).toStrictEqual(expected);
    });

    it("case nothing to remove", () => {
        const nodes: FormFieldGroupLike["nodes"] = [
            {
                type: "field"
            },
            {
                type: "group",
                nodes: [
                    {
                        type: "group",
                        nodes: [
                            {
                                type: "field"
                            }
                        ],
                        canAdd: false
                    },
                    {
                        type: "field"
                    }
                ],
                canAdd: false
            }
        ];

        const got = structuredClone(nodes);

        removeFormFieldGroupWithNoNodes({
            nodes: got
        });

        const expected = nodes;

        expect(got).toStrictEqual(expected);
    });
});
