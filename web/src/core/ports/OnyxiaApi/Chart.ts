export type Chart = {
    name: string;
    versions: {
        description: string;
        version: string;
        icon: string | undefined;
        home: string | undefined;
    }[];
};
