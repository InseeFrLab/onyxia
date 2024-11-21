import type { Meta, StoryObj } from "@storybook/react";
import { SecretsExplorer } from "./SecretsExplorer";
import { Evt } from "evt";
import { action } from "@storybook/addon-actions";
import React from "react";

const meta = {
    title: "Pages/MySecrets/SecretsExplorer/SecretsExplorer",
    component: SecretsExplorer
} satisfies Meta<typeof SecretsExplorer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        doShowHidden: false,
        directoryPath: "/home/user/secrets",
        isNavigating: false,
        commandLogsEntries: [],
        evtAction: Evt.create<"TRIGGER COPY PATH">(),
        files: ["secret1.txt", "config.json"],
        directories: ["api-keys", "certificates"],
        directoriesBeingCreated: [],
        directoriesBeingRenamed: [],
        filesBeingCreated: [],
        filesBeingRenamed: [],
        onNavigate: action("Navigate"),
        onRefresh: action("Refresh"),
        onEditBasename: action("Edit Basename"),
        onDeleteItem: action("Delete Item"),
        onNewItem: action("New Item"),
        onCopyPath: action("Copy Path"),
        scrollableDivRef: React.createRef(),
        isCommandBarEnabled: true,
        isFileOpen: false,
        onOpenFile: action("Open File")
    }
};
