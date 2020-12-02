import React from "react";
import type { Story, Meta } from "@storybook/react";
import { id } from "evt/tools/typeSafety/id";

import { Button } from "./Button";
import type { ButtonProps } from "./Button";

export default id<Meta>({
  "title": 'Example/Button',
  "component": Button,
  "argTypes": {
    "backgroundColor": { "control": "color" }
  },
});

const Template: Story<ButtonProps> = args => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  "primary": true,
  "label": "Button"
};

export const Secondary = Template.bind({});
Secondary.args = {
  "label": "Button"
};

export const Large = Template.bind({});
Large.args = {
  "size": "large",
  "label": "Button"
};

