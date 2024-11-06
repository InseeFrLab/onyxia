import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxFormField } from "./CheckboxFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/formFields/CheckboxFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

type Params = {
    isReadonly: boolean;
};

function StoryWrapper(params: Params) {
    const { isReadonly } = params;

    const [value, setValue] = useState(false);

    return (
        <>
            <CheckboxFormField
                className={css({ width: 300, maxHeight: 400 })}
                title="This is the title"
                description="This is the description"
                isReadonly={isReadonly}
                value={value}
                onChange={newValue => {
                    onChangeAction(newValue);
                    setValue(newValue);
                }}
                onRemove={undefined}
            />
            <Divider />
            <p>Value: </p>
            <pre>{JSON.stringify(value)}</pre>
        </>
    );
}

export const Default: Story = {
    args: {
        isReadonly: false
    }
};

export const Readonly: Story = {
    args: {
        isReadonly: true
    }
};
