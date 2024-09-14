import type { Meta, StoryObj } from "@storybook/react";
import { RoundLogo } from "./RoundLogo";

const meta = {
    title: "Shared/RoundLogo",
    component: RoundLogo
} satisfies Meta<typeof RoundLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        url: "https://minio.lab.sspcloud.fr/projet-onyxia/assets/servicesImg/vscode.png",
        size: "default"
    }
};
