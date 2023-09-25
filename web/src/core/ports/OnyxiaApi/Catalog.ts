import type { LocalizedString } from "./Language";

export type Catalog = {
    id: string;
    name: LocalizedString;
    location: string;
    description: LocalizedString;
    status: "PROD" | "TEST";
    charts: Catalog.Chart[];
    highlightedCharts?: string[];
};

export namespace Catalog {
    export type Chart = {
        name: string;
        versions: {
            description: string;
            version: string;
            icon: string | undefined;
            home: string | undefined;
        }[];
    };
}
