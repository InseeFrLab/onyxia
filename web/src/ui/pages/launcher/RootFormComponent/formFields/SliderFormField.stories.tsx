import type { Meta, StoryObj } from "@storybook/react";
import { SliderFormField } from "./SliderFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/SliderFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");
const onRemoveAction = action("onRemove");

type Params = {
    isReadonly: boolean;
    min: number;
    max: number;
    unit: string | undefined;
    step: number | undefined;
    defaultValue: number;
    hasOnRemove: boolean;
};

function StoryWrapper(params: Params) {
    const { isReadonly, min, max, unit, step, defaultValue, hasOnRemove } = params;

    const [value, setValue] = useState(defaultValue);

    return (
        <>
            <SliderFormField
                className={css({ width: 300, maxHeight: 400 })}
                title="This is the title"
                description="This is the description"
                isReadonly={isReadonly}
                min={min}
                max={max}
                unit={unit}
                step={step}
                value={value}
                onChange={newValue => {
                    onChangeAction(newValue);
                    setValue(newValue);
                }}
                onRemove={hasOnRemove ? () => onRemoveAction() : undefined}
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
        min: 0,
        max: 100,
        unit: "m",
        step: 1,
        defaultValue: 50,
        hasOnRemove: false
    }
};

export const WithMarks: Story = {
    args: {
        isReadonly: false,
        min: 1,
        max: 7,
        unit: undefined,
        step: 1,
        defaultValue: 2,
        hasOnRemove: false
    }
};

export const WitNoOptions: Story = {
    args: {
        isReadonly: false,
        min: 1,
        max: 1,
        unit: undefined,
        step: 1,
        defaultValue: 1,
        hasOnRemove: false
    }
};

export const ReadOnly: Story = {
    args: {
        isReadonly: true,
        min: 0,
        max: 100,
        unit: "m",
        step: 1,
        defaultValue: 50,
        hasOnRemove: false
    }
};

export const WithOnRemove: Story = {
    args: {
        isReadonly: false,
        min: 0,
        max: 100,
        unit: "m",
        step: 1,
        defaultValue: 50,
        hasOnRemove: true
    }
};
