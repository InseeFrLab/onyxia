export type Project = {
    id: string;
    name: string;
    bucket: string;
    group: string | undefined;
    namespace: string;
    vaultTopDir: string;
};
