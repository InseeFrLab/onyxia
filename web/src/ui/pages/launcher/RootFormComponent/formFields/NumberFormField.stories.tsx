import type { Meta, StoryObj } from "@storybook/react";
import { NumberFormField } from "./NumberFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/formFields/NumberFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");
const onErrorChangeAction = action("onErrorChange");

type Params = {
    isReadonly: boolean;
    isInteger: boolean;
    minimum: number | undefined;
    defaultValue: number;
};

function StoryWrapper(params: Params) {
    const { isReadonly, isInteger, minimum, defaultValue } = params;

    const [value, setValue] = useState(defaultValue);

    return (
        <>
            <NumberFormField
                className={css({ width: 300, maxHeight: 400 })}
                title="This is the title"
                description="This is the description"
                isInteger={isInteger}
                isReadonly={isReadonly}
                minimum={minimum}
                value={value}
                onChange={newValue => {
                    onChangeAction(newValue);
                    setValue(newValue);
                }}
                onRemove={undefined}
                onErrorChange={onErrorChangeAction}
                isHidden={false}
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
        isInteger: true,
        minimum: 1,
        defaultValue: 3
    }
};

export const NonInteger: Story = {
    args: {
        isReadonly: false,
        isInteger: false,
        minimum: 2.3,
        defaultValue: 4.5
    }
};
