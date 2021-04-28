
import type { Region } from "js/model/Region";
export type { Region };
export type Build = {
    version: string;
    timestamp: number;
};

export type Catalog = {
    catalog: Packages;
    id: string;
    name: string;
    description: string;
    maintainer: string;
    location: string;
    status: string;
    lastUpdateTime: number;
    type: string;
};

export type Packages = {
    packages: Package[]
    apiVersion: string;
    generated: string;
};

export type Package = {
    apiVersion: string;
    appVersion?: string;
    created: string;
    description: string;
    digest: string;
    icon?: string;
    name: string;
    urls: string[];
    version: string;
    config: unknown;
    type: string;
    dependencies?: unknown[];
};




export type OnyxiaApiClient = {

    /*
    //Implemented on backend but useless for us.
    getUserInfo(): Promise<{
        ip: string;
        nomComplet: string;
    }>;
    */

    getConfigurations: {
        (): Promise<{ regions: Region[]; build: Build; }>;
        /* Result is memoized, clear the cache with this method */
        clear(): void;
    };

    getCatalogs: {
        (): Promise<Catalog[]>;
        clear(): void;
    };

};