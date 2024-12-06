import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import DataEditor from "./DataEditor";
import type { Stringifyable } from "core/tools/Stringifyable";

const meta = {
    title: "Shared/CodeEditor/DataEditor",
    component: StoryComponent
} satisfies Meta<typeof StoryComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};

const JSON_SCHEMA = {
    type: "object",
    properties: {
        name: {
            type: "string"
        },
        age: {
            type: "number"
        },
        isDeveloper: {
            type: "boolean"
        }
    },
    required: ["name", "age"]
};

function StoryComponent() {
    const [value, setValue] = useState<Stringifyable>({
        name: "John",
        age: 25,
        isDeveloper: true
    });

    useEffect(() => {
        console.log("value", value);
    }, [value]);

    return (
        <DataEditor
            id="data-editor"
            defaultHeight={300}
            value={value}
            onChange={setValue}
            jsonSchema={JSON_SCHEMA}
        />
    );
}
