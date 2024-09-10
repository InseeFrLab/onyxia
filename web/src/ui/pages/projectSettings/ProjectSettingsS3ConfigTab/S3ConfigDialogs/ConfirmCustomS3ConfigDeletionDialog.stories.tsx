import { Meta, StoryObj } from "@storybook/react";
import { ConfirmCustomS3ConfigDeletionDialog } from "./ConfirmCustomS3ConfigDeletionDialog";
import { Evt } from "evt";
import { action } from "@storybook/addon-actions";
import { Button } from "onyxia-ui/Button";

const meta = {
    title: "Pages/ProjectSettings/S3ConfigDialogs/ConfirmCustomS3ConfigDeletionDialog",
    component: ConfirmCustomS3ConfigDeletionDialog
} satisfies Meta<typeof ConfirmCustomS3ConfigDeletionDialog>;

export default meta;

type Story = StoryObj<typeof ConfirmCustomS3ConfigDeletionDialog>;

export const Default: Story = {
    render: () => {
        const evtOpen = Evt.create<{
            resolveDoProceed: (doProceed: boolean) => void;
        }>();

        const openDialog = () => {
            evtOpen.post({
                resolveDoProceed: doProceed => {
                    action(`User decision ${doProceed ? "proceed" : "cancel"}`)();
                }
            });
        };

        return (
            <>
                <Button onClick={openDialog}>Open Dialog</Button>
                <ConfirmCustomS3ConfigDeletionDialog evtOpen={evtOpen} />
            </>
        );
    }
};
