import type { Meta, StoryObj } from "@storybook/react";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "./MaybeAcknowledgeConfigVolatilityDialog";
import { Evt } from "evt";

const meta = {
    title: "Shared/MaybeAcknowledgeConfigVolatilityDialog",
    component: MaybeAcknowledgeConfigVolatilityDialog
} satisfies Meta<typeof MaybeAcknowledgeConfigVolatilityDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

// Create a mock event for opening the dialog
const evtOpen = Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>();

export const Default: Story = {
    args: {
        evtOpen
    }
};

export const DialogOpen: Story = {
    args: {
        evtOpen: Evt.create({
            resolve: (params: { doProceed: boolean }) => {
                console.log("Dialog decision:", params.doProceed);
            }
        })
    }
};
