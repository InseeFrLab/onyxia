import type { Meta, StoryObj } from "@storybook/react";
import { SelectFormField } from "./SelectFormField";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import type { Stringifyable } from "core/tools/Stringifyable";

const meta = {
    title: "pages/Launcher/SelectFormField",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const onChangeAction = action("onChange");

type Params = {
    isReadonly: boolean;
    options: Stringifyable[];
};

function StoryWrapper(params: Params) {
    const { isReadonly, options } = params;

    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

    return (
        <>
            <SelectFormField
                className={css({ width: 300, maxHeight: 400 })}
                title="This is the title"
                description="This is the description"
                isReadonly={isReadonly}
                options={options}
                selectedOptionIndex={selectedOptionIndex}
                onSelectedOptionIndexChange={newSelectedOptionIndex => {
                    onChangeAction(newSelectedOptionIndex);
                    setSelectedOptionIndex(newSelectedOptionIndex);
                }}
                onRemove={undefined}
            />
            <Divider />
            <p>selectedOptionIndex: </p>
            <pre>{selectedOptionIndex}</pre>
        </>
    );
}

export const Default: Story = {
    args: {
        isReadonly: false,
        options: ["Option 1", "Option 2", "Option 3"]
    }
};

export const ObjectOptions: Story = {
    args: {
        isReadonly: false,
        options: [
            { foo: "a", bar: "b" },
            { foo: "c", bar: "d" },
            { foo: "e", bar: "f" }
        ]
    }
};

export const ArrayOptions: Story = {
    args: {
        isReadonly: false,
        options: [
            ["a", "b", "c"],
            ["d", "e", "f"],
            ["g", "h", "i"],
            ["j", "k", "l"]
        ]
    }
};

export const Disabled: Story = {
    args: {
        isReadonly: true,
        options: ["Option 1", "Option 2", "Option 3"]
    }
};
