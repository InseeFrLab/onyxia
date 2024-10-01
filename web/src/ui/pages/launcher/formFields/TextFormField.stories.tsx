import type { Meta, StoryObj } from "@storybook/react";
import { TextFormField } from "./TextFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/formFields/TextFormField",
    component: StoryWrapper
} satisfies Meta<typeof TextFormField>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

type Params = {
    isReadonly: boolean;
    doRenderAsTextArea: boolean;
    isSensitive: boolean;
    pattern: string | undefined;
};

function StoryWrapper(params: Params) {
    const { isReadonly, doRenderAsTextArea, isSensitive, pattern } = params;

    const [value, setValue] = useState("Hello, world!");

    return (
        <>
            <TextFormField
                className={css({ "width": 300, "maxHeight": 400 })}
                title="This is the title"
                description="This is the description"
                doRenderAsTextArea={doRenderAsTextArea}
                isReadonly={isReadonly}
                isSensitive={isSensitive}
                pattern={pattern}
                value={value}
                onChange={newValue => {
                    onChangeAction(newValue);
                    setValue(newValue);
                }}
            />
            <Divider />
            <p>Value: </p>
            <pre>{JSON.stringify(value)}</pre>
        </>
    );
}

export const Default: Story = {
    "args": {
        "isReadonly": false,
        "doRenderAsTextArea": false,
        "isSensitive": false,
        "pattern": undefined
    }
};

export const TextArea: Story = {
    "args": {
        "isReadonly": false,
        "doRenderAsTextArea": true,
        "isSensitive": false,
        "pattern": undefined
    }
};

export const Sensitive: Story = {
    "args": {
        "isReadonly": false,
        "doRenderAsTextArea": false,
        "isSensitive": true,
        "pattern": undefined
    }
};

export const WithPattern: Story = {
    "args": {
        "isReadonly": false,
        "doRenderAsTextArea": false,
        "isSensitive": false,
        "pattern": "^[a-zA-Z0-9]*$"
    }
};

export const Readonly: Story = {
    "args": {
        "isReadonly": true,
        "doRenderAsTextArea": false,
        "isSensitive": false,
        "pattern": undefined
    }
};
