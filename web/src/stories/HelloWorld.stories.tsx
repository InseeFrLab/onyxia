// Button.stories.tsx - Storybook file for the Button component
import React from "react";
import { Story, Meta } from "@storybook/react";

function Button({ label, onClick }: { label: string; onClick: () => void }) {
    React.useEffect(() => {
        (async () => {
            try {
                await import("env-parsed");
            } catch (e) {
                alert("===== the error" + String(e));
            }
        })();
    }, []);

    return <button onClick={onClick}>{label}</button>;
}

export default {
    title: "Example/Button",
    component: Button
} as Meta;

const Template: Story<{ label: string; onClick: () => void }> = args => (
    <Button {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
    label: "Click Me",
    onClick: () => alert("Button clicked")
};
