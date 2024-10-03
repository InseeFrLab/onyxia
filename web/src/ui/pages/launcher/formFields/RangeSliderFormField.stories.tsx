import type { Meta, StoryObj } from "@storybook/react";
import { RangeSliderFormField } from "./RangeSliderFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme";
import { useState } from "react";
import Divider from "@mui/material/Divider";

const meta = {
    title: "pages/Launcher/formFields/RangeSliderFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction_lowEndRange = action("onChange_lowEndRange");
const onChangeAction_highEndRange = action("onChange_highEndRange");

type Params = {
    title: string;
    unit: string | undefined;
    step: number | undefined;
    lowEndRange: {
        isReadonly: boolean;
        rangeEndSemantic: string | undefined;
        min: number;
        max: number;
        description: string | undefined;
        defaultValue: number;
    };
    highEndRange: {
        isReadonly: boolean;
        rangeEndSemantic: string | undefined;
        min: number;
        max: number;
        description: string | undefined;
        defaultValue: number;
    };
};

function StoryWrapper(params: Params) {
    const { title, unit, step, lowEndRange, highEndRange } = params;

    const [lowEndRangeValue, setLowEndRangeValue] = useState(lowEndRange.defaultValue);
    const [highEndRangeValue, setHighEndRangeValue] = useState(highEndRange.defaultValue);

    return (
        <>
            <RangeSliderFormField
                className={css({ "width": 300, "maxHeight": 400 })}
                title={title}
                unit={unit}
                step={step}
                lowEndRange={{
                    ...lowEndRange,
                    value: lowEndRangeValue,
                    onChange: newValue => {
                        onChangeAction_lowEndRange(newValue);
                        setLowEndRangeValue(newValue);
                    }
                }}
                highEndRange={{
                    ...highEndRange,
                    value: highEndRangeValue,
                    onChange: newValue => {
                        onChangeAction_highEndRange(newValue);
                        setHighEndRangeValue(newValue);
                    }
                }}
            />
            <Divider />
            <p>Value: </p>
            <pre>
                {JSON.stringify({
                    lowEndRangeValue,
                    highEndRangeValue
                })}
            </pre>
        </>
    );
}

export const Default: Story = {
    "args": {
        "title": "memory",
        "unit": "Gi",
        "step": 1,
        "lowEndRange": {
            "isReadonly": false,
            "rangeEndSemantic": "guaranteed",
            "min": 1,
            "max": 200,
            "description": "The amount of memory guaranteed",
            "defaultValue": 2
        },
        "highEndRange": {
            "isReadonly": false,
            "rangeEndSemantic": "maximum",
            "min": 1,
            "max": 200,
            "description": "The maximum amount of memory",
            "defaultValue": 50
        }
    }
};
