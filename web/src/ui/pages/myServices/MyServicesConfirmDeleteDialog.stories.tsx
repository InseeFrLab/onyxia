import type { Meta, StoryObj } from "@storybook/react";
import { MyServicesConfirmDeleteDialog } from "./MyServicesConfirmDeleteDialog";
import { Evt } from "evt";

const meta = {
    title: "Pages/MyServices/MyServicesConfirmDeleteDialog",
    component: MyServicesConfirmDeleteDialog
} satisfies Meta<typeof MyServicesConfirmDeleteDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const evtOpen = Evt.create({
    isThereOwnedSharedServices: false,
    resolveDoProceed: (doProceed: boolean) => {
        console.log("Proceed with deletion:", doProceed);
    }
});

export const Default: Story = {
    args: {
        evtOpen
    },
    play: async () => {
        // Trigger the dialog to open
        evtOpen.post({
            isThereOwnedSharedServices: false,
            resolveDoProceed: doProceed => {
                console.log(
                    "Dialog closed with action:",
                    doProceed ? "Confirm" : "Cancel"
                );
            }
        });
    }
};

export const WithOwnedSharedServices: Story = {
    args: {
        evtOpen
    },
    play: async () => {
        // Trigger the dialog to open with owned shared services
        evtOpen.post({
            isThereOwnedSharedServices: true,
            resolveDoProceed: doProceed => {
                console.log(
                    "Dialog closed with action:",
                    doProceed ? "Confirm" : "Cancel"
                );
            }
        });
    }
};
