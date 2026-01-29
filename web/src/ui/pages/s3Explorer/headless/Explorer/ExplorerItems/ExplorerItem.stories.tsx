import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItem } from "./ExplorerItem";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerItems/ExplorerItem",
    component: ExplorerItem
} satisfies Meta<typeof ExplorerItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FileSelected: Story = {
    args: {
        isBucketPolicyFeatureEnabled: true,
        kind: "file",
        basename: "example-file.txt",
        size: 100000000,
        policy: "private",
        className: css({ width: "160px", height: "160px" }),
        isSelected: true,
        isCircularProgressShown: false, // Valeur par défaut pour l'animation
        isPolicyChanging: false, // Pas de changement de politique en cours
        onPolicyChange: action("onPolicyChange"), // Action pour les changements de politique
        onClick: action("onClick"),
        onDoubleClick: action("onDoubleClick")
    }
};

export const DirectoryUnselected: Story = {
    args: {
        kind: "directory",
        isBucketPolicyFeatureEnabled: true,
        basename: "example-directory",
        size: undefined,
        policy: "public",
        className: css({ width: "160px", height: "160px" }),
        isSelected: false,
        isCircularProgressShown: false, // Valeur par défaut pour l'animation
        isPolicyChanging: false, // Pas de changement de politique en cours
        onPolicyChange: action("onPolicyChange"), // Action pour les changements de politique
        onClick: action("onClick"),
        onDoubleClick: action("onDoubleClick")
    }
};
