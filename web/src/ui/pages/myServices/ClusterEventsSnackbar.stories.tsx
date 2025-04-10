import type { Meta, StoryObj } from "@storybook/react";
import { ClusterEventsSnackbar } from "./ClusterEventsSnackbar";
import { Evt } from "evt";

const meta = {
    title: "Pages/MyServices/ClusterEventsSnackbar",
    component: ClusterEventsSnackbar
} satisfies Meta<typeof ClusterEventsSnackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

const evtAction = Evt.create<{
    action: "show notification";
    message: string;
    severity: "warning" | "info" | "error" | "success";
}>();

export const Default: Story = {
    args: {
        evtAction,
        onOpenClusterEventsDialog: () => {
            console.log("Cluster Events Dialog opened");
        }
    },
    play: async () => {
        // Trigger the snackbar notification after rendering
        evtAction.post({
            action: "show notification",
            message: "An error occurred during the cluster operation.",
            severity: "error"
        });
    }
};

export const WarningNotification: Story = {
    args: {
        evtAction,
        onOpenClusterEventsDialog: () => {
            console.log("Cluster Events Dialog opened");
        }
    },
    play: async () => {
        // Trigger a warning notification
        evtAction.post({
            action: "show notification",
            message: "Cluster resources are running low.",
            severity: "warning"
        });
    }
};

export const InfoNotification: Story = {
    args: {
        evtAction,
        onOpenClusterEventsDialog: () => {
            console.log("Cluster Events Dialog opened");
        }
    },
    play: async () => {
        evtAction.post({
            action: "show notification",
            message: "New cluster features are available.",
            severity: "info"
        });
    }
};

export const SuccessNotification: Story = {
    args: {
        evtAction,
        onOpenClusterEventsDialog: () => {
            console.log("Cluster Events Dialog opened");
        }
    },
    play: async () => {
        evtAction.post({
            action: "show notification",
            message: "Cluster upgraded successfully.",
            severity: "success"
        });
    }
};
