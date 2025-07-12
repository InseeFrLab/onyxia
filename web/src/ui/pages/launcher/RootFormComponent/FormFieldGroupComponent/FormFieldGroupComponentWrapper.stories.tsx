import type { Meta, StoryObj } from "@storybook/react";
import { FormFieldGroupComponentWrapper } from "./FormFieldGroupComponentWrapper";
import { useState } from "react";
import { useStyles } from "tss";

const meta = {
    title: "pages/Launcher/FormFieldGroupComponentWrapper",
    component: StoryWrapper
} satisfies Meta<typeof StoryWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

function StoryWrapper() {
    const [isAutoInjected, onIsAutoInjectedChange] = useState(true);

    const { css, theme } = useStyles();

    return (
        <FormFieldGroupComponentWrapper
            className={css({ marginLeft: theme.spacing(6) })}
            title="The Title"
            description="The description"
            onRemove={() => {
                console.log("Remove");
            }}
            autoInjection={{
                isAutoInjected,
                onIsAutoInjectedChange
            }}
        >
            <h1 style={{ margin: 0 }}>Lorem</h1>
            <p>Ipsum amet</p>
        </FormFieldGroupComponentWrapper>
    );
}

export const Default: Story = {
    args: {}
};
