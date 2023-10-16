export type Chart = {
    name: string;
    versions: {
        description: string | undefined;
        version: string;
        iconUrl: string | undefined;
        projectHomepageUrl: string | undefined;
    }[];
};
