import type { Meta, StoryObj } from "@storybook/react";
import { CatalogChartCard } from "./CatalogChartCard";
import { action } from "@storybook/addon-actions";
import { StringWithHighlights } from "core/usecases/catalog";

const meta = {
    title: "Pages/Catalog/CatalogChartCard",
    component: CatalogChartCard
} satisfies Meta<typeof CatalogChartCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const exampleChartNameWithHighlights: StringWithHighlights = {
    charArray: [
        "E",
        "x",
        "a",
        "m",
        "p",
        "l",
        "e",
        " ",
        "C",
        "h",
        "a",
        "r",
        "t",
        " ",
        "N",
        "a",
        "m",
        "e"
    ],
    highlightedIndexes: [0, 1, 2, 3, 4, 5, 6] // Highlights "Example"
};

const exampleChartDescriptionWithHighlights: StringWithHighlights = {
    charArray: [
        "T",
        "h",
        "i",
        "s",
        " ",
        "i",
        "s",
        " ",
        "a",
        "n",
        " ",
        "e",
        "x",
        "a",
        "m",
        "p",
        "l",
        "e",
        " ",
        "d",
        "e",
        "s",
        "c",
        "r",
        "i",
        "p",
        "t",
        "i",
        "o",
        "n"
    ],
    highlightedIndexes: [11, 12, 13, 14, 15, 16, 17] // Highlights "example"
};

export const Default: Story = {
    args: {
        chartNameWithHighlights: exampleChartNameWithHighlights,
        chartDescriptionWithHighlights: exampleChartDescriptionWithHighlights,
        projectHomepageUrl: "https://example.com",
        iconUrl:
            "https://minio.lab.sspcloud.fr/projet-onyxia/assets/servicesImg/vscode.png",
        onRequestLaunch: action("Launch button clicked")
    }
};
