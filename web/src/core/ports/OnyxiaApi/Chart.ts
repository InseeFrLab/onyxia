export type Chart = {
    name: string;
    versions: {
        description: string | undefined;
        version: string;
        icon: string | undefined;
        home: string | undefined;
    }[];
};
