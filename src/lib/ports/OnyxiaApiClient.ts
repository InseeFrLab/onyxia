
import type { Region } from "js/model/Region";
export type { Region };
export type Build = {
    version: string;
    timestamp: number;
};

export type OnyxiaApiClient = {

    getUserInfo(): Promise<{
        ip: string;
        nomComplet: string;
    }>;

    getConfigurations: {
        (): Promise<{ regions: Region[]; build: Build; }>;
        /* Result is memoized, clear the cache with this method */
        clear(): void; 
    }

};