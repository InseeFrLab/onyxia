
import type { Region } from 'js/model/Region';

export type Public_Configuration = {
    regions: Region[];
    build: {
        version: string;
        timestamp: number;
    };
};

export type Public_Catalog = {
    catalogs: {
        id: string;
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

export type Public_Catalog_CatalogId_PackageName = {
    config: Public_Catalog_CatalogId_PackageName.JSONSchemaObject;
    dependencies?: {
        enabled: boolean;
        name: string;
    }[];
};

export namespace Public_Catalog_CatalogId_PackageName {

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



export type OnyxiaApiClient = {

    getConfigurations: {
        (): Promise<Public_Configuration>;
        /* Result is memoized, clear the cache with this method */
        clear(): void;
    };

    getCatalogs: {
        (): Promise<Public_Catalog["catalogs"]>;
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
                mustacheParams: Public_Catalog_CatalogId_PackageName.MustacheParams;
            }
        ): Public_Catalog_CatalogId_PackageName["config"];
        dependencies: NonNullable<Public_Catalog_CatalogId_PackageName["dependencies"]>;
    }>;

    launchPackage(
        params: {
            catalogId: string;
            packageName: string;
            options: Record<string, unknown>;
            isDryRun: boolean;
        }
    ): Promise<{ contract: Record<string, unknown>; }>;

};
