
import type { Region } from 'js/model/Region';

export type Get_Public_Configuration = {
    regions: Region[];
    build: {
        version: string;
        timestamp: number;
    };
};

export type Get_Public_Catalog = {
    catalogs: {
        id: string;
        location: string;
        catalog: {
            packages: {
                description: string;
                icon?: string;
                name: string;
                home?: string;
            }[]
        };
    }[];
};

export type Get_Public_Catalog_CatalogId_PackageName = {
    config: Get_Public_Catalog_CatalogId_PackageName.JSONSchemaObject;
    sources: string[];
    dependencies?: {
        enabled: boolean;
        name: string;
    }[];
};

export namespace Get_Public_Catalog_CatalogId_PackageName {

    export type JSONSchemaObject = {
        description?: string;
        properties: Record<string, JSONSchemaObject | JSONSchemaFormFieldDescription>;
        type: "object";
    };

    export type JSONSchemaFormFieldDescription =
        JSONSchemaFormFieldDescription.String |
        JSONSchemaFormFieldDescription.Boolean |
        JSONSchemaFormFieldDescription.Integer;
    export namespace JSONSchemaFormFieldDescription {

        type Common<T> = {
            description?: string;
            title?: string;
            default?: T;
            'x-form'?: {
                hidden: boolean;
                readonly: boolean;
                value: T;
            }
        };

        export type String = {
            type: "string";
            enum?: string[];
        } & Common<string>;

        export type Boolean = {
            type: "boolean";
        } & Common<boolean>;

        export type Integer = {
            type: "number";
            minimum?: string;
        } & Common<number>;

    }

    export type MustacheParams = {
        user: {
            idep: string;
            name: string;
            email: string;
            password: string;
            ip: string;
        },
        git: {
            name: string;
            email: string;
            credentials_cache_duration: number;
            token: string | null;
        },
        vault: {
            VAULT_ADDR: string;
            VAULT_TOKEN: string;
            VAULT_MOUNT: string;
            VAULT_TOP_DIR: string;
        },
        kaggleApiToken: string | null;
        s3: {
            AWS_ACCESS_KEY_ID: string;
            AWS_SECRET_ACCESS_KEY: string;
            AWS_SESSION_TOKEN: string;
            AWS_DEFAULT_REGION: "us-east-1";
            AWS_S3_ENDPOINT: string;
            AWS_EXPIRATION: string;
            AWS_BUCKET_NAME: string;
        }
    };
}



export const appStatuses = ["Running", "Pending"] as const;

//TODO BACKEND: Provides catalogId
export type Get_MyLab_Services = {
    apps: {
        id: string;
        urls: string[];
        env: Record<string, string>;
        startedAt: number;
        tasks: { status: { status: Get_MyLab_Services.AppStatus; } }[];
        postInstallInstructions: string | undefined;
    }[]
};

export declare namespace Get_MyLab_Services {
    export type AppStatus= typeof appStatuses[number];
}

export type Put_MyLab_App= Record<string, unknown>[][];

export type Get_MyLab_App = { };

export type Get_User_Info = {
    ip: string;
};

export const onyxiaFriendlyNameFormFieldPath = ["onyxia", "friendlyName"];

export type OnyxiaApiClient = {

    getPublicIp: {
        (): Promise<string>;
        clear(): void;
    };

    getConfigurations: {
        (): Promise<Get_Public_Configuration>;
        /* Result is memoized, clear the cache with this method */
        clear(): void;
    };

    getCatalogs: {
        (): Promise<Get_Public_Catalog["catalogs"]>;
        clear(): void;
    };

    getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory(
        params: {
            catalogId: string;
            packageName: string;
        }
    ): Promise<{
        getPackageConfigJSONSchemaObjectWithRenderedMustachParams(
            params: {
                mustacheParams: Get_Public_Catalog_CatalogId_PackageName.MustacheParams;
            }
        ): Get_Public_Catalog_CatalogId_PackageName["config"];
        dependencies: NonNullable<Get_Public_Catalog_CatalogId_PackageName["dependencies"]>;
        sources: Get_Public_Catalog_CatalogId_PackageName["sources"];
    }>;

    launchPackage(
        params: {
            catalogId: string;
            packageName: string;
            options: Record<string, unknown>;
            isDryRun: boolean;
        }
    ): Promise<{ contract: Put_MyLab_App; }>;

    getRunningServices(): Promise<
        ({
            id: string;
            packageName: string;
            friendlyName: string;
            urls: string[];
            startedAt: number;
            postInstallInstructions: string | undefined;
        } & ({
            isStarting: false;
        } | {
            isStarting: true;
            prStarted: Promise<{ isConfirmedJustStarted: boolean; }>;
        }))[]
    >;

    stopService(
        params: {
            serviceId: string;
        }
    ): Promise<void>;

};
