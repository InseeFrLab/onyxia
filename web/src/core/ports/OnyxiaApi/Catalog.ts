import type { LocalizedString } from "./Language";

export type Catalog = {
    id: string;
    name: LocalizedString;
    repositoryUrl: string;
    description: LocalizedString | undefined;
    isHidden: boolean;
};
