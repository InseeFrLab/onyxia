import type { Meta, StoryObj } from "@storybook/react";
import {} from "./";
import { action } from "@storybook/addon-actions";
import { PolicySwitch } from "./PolicySwitch";
import { useState } from "react";
import { Item } from "../shared/types";

const meta = {
    title: "Pages/MyFiles/Explorer/PolicySwitch",
    component: PolicySwitch,
    argTypes: {
        size: {
            control: { type: "select" },
            options: ["small", "medium", "large"]
        },
        policy: {
            control: { type: "select" },
            options: ["public", "private"]
        }
    }
} satisfies Meta<typeof PolicySwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        changePolicy: action("Change policy"),
        policy: "private"
    },
    render: props => {
        const { changePolicy, ...rest } = props;
        const [policy, setPolicy] = useState<Item["policy"]>(props.policy);

        return (
            <PolicySwitch
                {...rest}
                policy={policy}
                changePolicy={e => {
                    changePolicy(e);
                    setPolicy(prev => (prev === "private" ? "public" : "private"));
                }}
            />
        );
    }
};
