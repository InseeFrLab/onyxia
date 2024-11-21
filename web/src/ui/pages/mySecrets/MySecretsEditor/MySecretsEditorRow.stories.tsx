import type { Meta, StoryObj } from "@storybook/react";
import { MySecretsEditorRow } from "./MySecretsEditorRow";
import { Evt } from "evt";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MySecrets/MySecretsEditor/MySecretsEditorRow",
    component: MySecretsEditorRow
} satisfies Meta<typeof MySecretsEditorRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isLocked: false,
        keyOfSecret: "API_KEY",
        strValue: "12345",
        onEdit: action("Edit secret"),
        onDelete: action("Delete secret"),
        getIsValidAndAvailableKey: () => ({
            isValidAndAvailableKey: true
        }),
        onStartEdit: action("Start editing"),
        evtAction: Evt.create<"ENTER EDITING STATE" | "SUBMIT EDIT">(),
        isDarker: false
    }
};
