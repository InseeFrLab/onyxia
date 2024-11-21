import type { Meta, StoryObj } from "@storybook/react";
import { MySecretsEditor } from "./MySecretsEditor";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MySecrets/MySecretsEditor/MySecretsEditor",
    component: MySecretsEditor
} satisfies Meta<typeof MySecretsEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isBeingUpdated: false,
        secretWithMetadata: {
            secret: {
                API_KEY: "12345",
                DB_PASSWORD: "mypassword",
                config: { json: "content" }
            },
            metadata: {
                created_time: "2023-01-01T00:00:00Z",
                deletion_time: "",
                destroyed: false,
                version: 1
            }
        },
        onEdit: action("Edit secret"),
        onCopyPath: action("Copy path"),
        doDisplayUseInServiceDialog: false,
        onDoDisplayUseInServiceDialogValueChange: action(
            "Do display use in service dialog value change"
        )
    }
};

export const UseInServicesOpenDialog: Story = {
    args: {
        isBeingUpdated: false,
        secretWithMetadata: {
            secret: {
                API_KEY: "12345",
                DB_PASSWORD: "mypassword",
                config: { json: "content" }
            },
            metadata: {
                created_time: "2023-01-01T00:00:00Z",
                deletion_time: "",
                destroyed: false,
                version: 1
            }
        },
        onEdit: action("Edit secret"),
        onCopyPath: action("Copy path"),
        doDisplayUseInServiceDialog: true,
        onDoDisplayUseInServiceDialogValueChange: action(
            "Do display use in service dialog value change"
        )
    }
};
