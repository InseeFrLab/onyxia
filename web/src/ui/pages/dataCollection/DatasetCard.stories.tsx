import { DatasetCard } from "./DatasetCard";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
    title: "Pages/DataCollection/DatasetCard",
    component: DatasetCard
} satisfies Meta<typeof DatasetCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockDataset: React.ComponentProps<typeof DatasetCard>["dataset"] = {
    id: "dataset-123",
    title: "Comptes des administrations publiques",
    description:
        "Ce jeu de données contient les comptes consolidés des trois sous-secteurs des administrations publiques.",
    keywords: ["Statistiques", "Finance publique"],
    issuedDate: "2024-12-18T17:25:43",
    landingPageUrl: "https://catalogue-donnees.insee.fr/fr/catalogue/DD_CNA_APU",
    licenseUrl: "https://www.etalab.gouv.fr/licence-ouverte-open-licence",
    distributions: [
        {
            id: "dist-1",
            format: "text/csv",
            downloadUrl: "https://api.insee.fr/melodi/file/DD_CNA_APU/DD_CNA_APU_CSV_FR",
            sizeInBytes: 543172,
            accessUrl: undefined
        }
    ]
};

export const Default: Story = {
    args: {
        dataset: mockDataset
    }
};

export const NoDistributions: Story = {
    args: {
        dataset: {
            ...mockDataset,
            distributions: []
        }
    }
};

export const MultipleDistributions: Story = {
    args: {
        dataset: {
            ...mockDataset,
            distributions: [
                {
                    id: "dist-1",
                    format: "text/csv",
                    downloadUrl: "https://example.com/data.csv",
                    sizeInBytes: 123456,
                    accessUrl: undefined
                },
                {
                    id: "dist-2",
                    format: "application/json",
                    downloadUrl: "https://example.com/data.json",
                    sizeInBytes: 98765,
                    accessUrl: undefined
                }
            ]
        }
    }
};
