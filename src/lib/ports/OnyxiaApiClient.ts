
import type { Region } from "js/model/Region";
export type { Region };

//TODO: Remove unused properties in type declaration

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
    home?: string;
};

export type PackageConfig = {
    name: string;
    urls: string[];
    sources: string[];
    icon?: string;
    home: string;
    description: string;
    config: PackageConfig.JSONSchemaObject;
};

export declare namespace PackageConfig {

    export type JSONSchemaObject = {
        description: string;
        properties: Record<string, JSONSchemaObject | FormFieldDescription>;
        type: "object";
    };

    export type FormFieldDescription =
        FormFieldDescription.String |
        FormFieldDescription.Boolean;
    export namespace FormFieldDescription {

        type Common<T> = {
            description: string;
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
        (): Promise<{ regions: Region[]; build: Build; }>;
        /* Result is memoized, clear the cache with this method */
        clear(): void;
    };

    getCatalogs: {
        (): Promise<Catalog[]>;
        clear(): void;
    };

    getPackageConfigFactory(
        params: {
            catalogId: string;
            packageName: string;
        }
    ): Promise<{
        getPackageConfig(
            params: {
                mustacheParams: PackageConfig.MustacheParams;
            }
        ): PackageConfig;
    }>;

    launchPackage(
        params: {
            catalogId: string;
            packageName: string;
            options: Record<string, unknown>;
        }
    ): Promise<void>;

};
