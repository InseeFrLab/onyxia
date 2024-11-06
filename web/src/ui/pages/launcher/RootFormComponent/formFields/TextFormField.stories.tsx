import type { Meta, StoryObj } from "@storybook/react";
import { TextFormField } from "./TextFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/TextFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");
const onRemoveAction = action("onRemove");
const onErrorChangeAction = action("onErrorChange");

type Params = {
    isReadonly: boolean;
    doRenderAsTextArea: boolean;
    isSensitive: boolean;
    pattern: string | undefined;
    hasOnRemove: boolean;
};

function StoryWrapper(params: Params) {
    const { isReadonly, doRenderAsTextArea, isSensitive, pattern, hasOnRemove } = params;

    const [value, setValue] = useState("Hello, world!");

    return (
        <>
            <TextFormField
                className={css({ width: 300, maxHeight: 400 })}
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
                onRemove={hasOnRemove ? () => onRemoveAction() : undefined}
                onErrorChange={onErrorChangeAction}
            />
            <Divider />
            <p>Value: </p>
            <pre>{JSON.stringify(value)}</pre>
        </>
    );
}

export const Default: Story = {
    args: {
        isReadonly: false,
        doRenderAsTextArea: false,
        isSensitive: false,
        pattern: undefined,
        hasOnRemove: false
    }
};

export const TextArea: Story = {
    args: {
        isReadonly: false,
        doRenderAsTextArea: true,
        isSensitive: false,
        pattern: undefined,
        hasOnRemove: false
    }
};

export const Sensitive: Story = {
    args: {
        isReadonly: false,
        doRenderAsTextArea: false,
        isSensitive: true,
        pattern: undefined,
        hasOnRemove: false
    }
};

export const WithPattern: Story = {
    args: {
        isReadonly: false,
        doRenderAsTextArea: false,
        isSensitive: false,
        pattern: "^[a-zA-Z0-9]*$",
        hasOnRemove: false
    }
};

export const Readonly: Story = {
    args: {
        isReadonly: true,
        doRenderAsTextArea: false,
        isSensitive: false,
        pattern: undefined,
        hasOnRemove: false
    }
};

export const WithOnRemove: Story = {
    args: {
        isReadonly: false,
        doRenderAsTextArea: false,
        isSensitive: false,
        pattern: undefined,
        hasOnRemove: true
    }
};
