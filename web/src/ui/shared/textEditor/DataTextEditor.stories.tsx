import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DataTextEditor } from "./DataTextEditor";
import type { Stringifyable } from "core/tools/Stringifyable";

const meta = {
    title: "Shared/DataTextEditor",
    component: StoryComponent
} satisfies Meta<typeof StoryComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        jsonSchema: {
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
                },
                favoritePet: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            },
            required: ["name", "age"]
        },
        value: {
            name: "John",
            age: 25,
            isDeveloper: true,
            favoritePet: ["cats", "dogs"]
        }
    }
};

export const DefaultWithError: Story = {
    args: {
        jsonSchema: {
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
                },
                favoritePet: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            },
            required: ["name", "age"]
        },
        value: ["a", "b", "c"]
    }
};

export const SimpleArray: Story = {
    args: {
        jsonSchema: {
            type: "array"
        },
        value: ["foo", "bar", "baz"]
    }
};

export const SimpleObject: Story = {
    args: {
        jsonSchema: {
            type: "object"
        },
        value: {
            key1: "foo",
            key2: "bar"
        }
    }
};

export const SimpleArrayError: Story = {
    args: {
        jsonSchema: {
            type: "array"
        },
        value: { key: "this is an object but we expect an array" }
    }
};

export const SimpleObjectError: Story = {
    args: {
        jsonSchema: {
            type: "array"
        },
        value: ["this", "is", "an", "array", "but", "we", "expect", "an", "object"]
    }
};

type Props = {
    jsonSchema: Record<string, Stringifyable>;
    value: Stringifyable;
};

function StoryComponent(props: Props) {
    const { jsonSchema, value: value_default } = props;

    const [value, setValue] = useState<Stringifyable>(value_default);

    useEffect(() => {
        console.log("value", value);
    }, [value]);

    return (
        <>
            <DataTextEditor
                id="data-text-editor"
                value={value}
                onChange={setValue}
                jsonSchema={jsonSchema}
                onErrorMsgChanged={errorMsg => console.log({ errorMsg })}
            />
            <div>
                <h3>Value:</h3>
                <pre>{JSON.stringify(value, null, 2)}</pre>
            </div>
        </>
    );
}
