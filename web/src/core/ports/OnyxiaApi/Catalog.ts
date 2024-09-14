import type { LocalizedString } from "./Language";

export type Catalog = {
    id: string;
    name: LocalizedString;
    repositoryUrl: string;
    description: LocalizedString | undefined;
    isProduction: boolean;
    visibility: "always" | "ony in personal projects" | "only in groups projects";
};
