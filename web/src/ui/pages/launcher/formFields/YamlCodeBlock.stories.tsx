import type { Meta, StoryObj } from "@storybook/react";
import { YamlCodeBlockFormField } from "./YamlCodeBlockFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme";
import { useState } from "react";
import type { Stringifyable } from "core/tools/Stringifyable";

const meta = {
    title: "pages/Launcher/formFields/YamlCodeBlock",
    component: StoryWrapper
} satisfies Meta<typeof YamlCodeBlockFormField>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

function StoryWrapper() {
    const [value, setValue] = useState<Stringifyable[] | Record<string, Stringifyable>>({
        "key1": "value1",
        "key2": 42,
        "arr": ["a", "b", "c"],
        "obj": {
            "isSomething": true,
            "name": "John",
            "nested": {
                "a": 1,
                "b": 2
            }
        }
    });

    return (
        <>
            <YamlCodeBlockFormField
                className={css({ "width": 400, "maxHeight": 400 })}
                title="This is the title"
                description="This is the description"
                expectedDataType="object"
                value={value}
                onChange={newValue => {
                    onChangeAction(newValue);
                    setValue(newValue);
                }}
            />
            <br />
            <br />
            <p>Value: </p>
            <pre>{JSON.stringify(value, null, 4)}</pre>
        </>
    );
}

export const Default: Story = {};
