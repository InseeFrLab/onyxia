import type { OnyxiaApiClient, DeploymentRegion } from "../ports/OnyxiaApiClient";
import Mustache from "mustache";

import memoize from "memoizee";

export function createMockOnyxiaApiClient(params: {
    availableDeploymentRegions: DeploymentRegion[];
}): OnyxiaApiClient {
    const { availableDeploymentRegions } = params;

    return {
        "getIp": memoize(() => Promise.resolve("0.0.0.0"), { "promise": true }),
        "getUserProjects": () =>
            Promise.resolve([
                { "id": "my-project", "name": "my project", "bucket": "my-project" },
            ]),
        "getAvailableRegions": memoize(
            () => Promise.resolve(availableDeploymentRegions),
            { "promise": true },
        ),
        "getCatalogs": memoize(() => Promise.resolve(data1), {
            "promise": true,
        }),
        "getPackageConfigJSONSchemaObjectWithRenderedMustachParamsFactory": () =>
            Promise.resolve().then(() => ({
                "dependencies": [],
                "sources": ["https://example.com"],
                "getPackageConfigJSONSchemaObjectWithRenderedMustachParams": ({
                    mustacheParams,
                }) =>
                    JSON.parse(
                        Mustache.render(JSON.stringify(data2.config), mustacheParams),
                    ) as any,
            })),
        "launchPackage": () => Promise.resolve().then(() => ({ "contract": [] })),
        "getRunningServices": () => Promise.resolve([]),
        "stopService": () => Promise.resolve(),
    };
}

const data1 = [
    {
        "catalog": {
            "packages": [
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-04T12:59:13.777658775Z",
                    "description":
                        "BlazingSQL provides a high-performance distributed SQL engine in Python. Built on the RAPIDS GPU data science ecosystem, ETL massive datasets on GPUs.",
                    "digest":
                        "e28a40c0c473cbde53e6c29b1eaad5d24664d1b9d1ea963cf0b1b723131813ec",
                    "icon": "https://blazingsql.com/src/assets/etl-data-from-datalake-to-rapids-ai.png",
                    "name": "blazingsql",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/blazingsql-0.1.10/blazingsql-0.1.10.tgz",
                    ],
                    "version": "0.1.10",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "blazingsql",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "blazingsql",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "limits": {
                                        "type": "object",
                                        "description": "No limit for cpu and memory",
                                        "properties": {
                                            "nvidia.com/gpu": {
                                                "type": "number",
                                                "description":
                                                    "GPU to allocate to this instance. This is also requested",
                                                "minimum": "0",
                                                "default": 0,
                                            },
                                        },
                                    },
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-01-16T10:00:17.634070827Z",
                    "description": "A cloudshell (ubuntu with webssh)",
                    "digest":
                        "6d1deab2e3b41581b2cdffc321a8afdcb7693fcdd6d6f47051f9e0b07bf94064",
                    "name": "cloudshell",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/cloudshell-1.14/cloudshell-1.14.tgz",
                    ],
                    "version": "1.14",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "cloudshell",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "cloudshell",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-03-11T07:37:15.970157091Z",
                    "description":
                        "Elasticsearch is a search engine based on the Lucene library. It provides a distributed, multitenant-capable full-text search engine with an HTTP web interface and schema-free JSON documents",
                    "digest":
                        "60a2c1432f096052449d06646a9c37dbeb5144f13414e4c73d153350d9ed4f7e",
                    "icon": "https://downloads.mesosphere.com/universe/assets/elasticsearch-small.png",
                    "name": "elastic",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/elastic-0.0.3/elastic-0.0.3.tgz",
                    ],
                    "version": "0.0.3",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "jupyter",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "elasticsearch": {
                                "type": "object",
                                "description": "postgres specific configuration",
                                "properties": {
                                    "image": {
                                        "type": "string",
                                        "description": "image docker",
                                        "default":
                                            "docker.elastic.co/elasticsearch/elasticsearch",
                                        "enum": [
                                            "docker.elastic.co/elasticsearch/elasticsearch",
                                            "docker.elastic.co/elasticsearch/elasticsearch-oss",
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                    "dependencies": [
                        {
                            "enabled": true,
                            "name": "elasticsearch",
                            "repository": "https://helm.elastic.co",
                            "version": "7.10.2",
                        },
                        {
                            "enabled": true,
                            "name": "kibana",
                            "repository": "https://helm.elastic.co",
                            "version": "7.10.2",
                        },
                    ],
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-04-27T13:16:41.266751304Z",
                    "description":
                        "fastai is a deep learning library which provides practitioners with high-level components that can quickly and easily provide state-of-the-art results in standard deep learning domains, and provides researchers with low-level components that can be mixed and matched to build new approaches.",
                    "digest":
                        "5beb4e560de6267d208cc40ae32c57d2ed8689ccc9f52520ea90fa1a330dca7a",
                    "icon": "https://cdn-images-1.medium.com/max/1200/1*0jBgSuZf2y8g7JOvWQjsVg.png",
                    "name": "fastai",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/fastai-0.0.3/fastai-0.0.3.tgz",
                    ],
                    "version": "0.0.3",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "fastai",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "fastai",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "limits": {
                                        "type": "object",
                                        "description": "No limit for cpu and memory",
                                        "properties": {
                                            "nvidia.com/gpu": {
                                                "type": "number",
                                                "description":
                                                    "GPU to allocate to this instance. This is also requested",
                                                "minimum": "0",
                                                "default": 0,
                                            },
                                        },
                                    },
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-04-01T09:01:51.159880075Z",
                    "description":
                        "A hive metastore manage the metadata of persistent relational entities (e.g. databases, tables, columns, partitions) in a relational database (for fast access).",
                    "digest":
                        "b04374a29e68649ad34b9bfde7418f069abf72577ccf45d88250f5fa952e7fa1",
                    "icon": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Apache_Hive_logo.svg/1200px-Apache_Hive_logo.svg.png",
                    "name": "hive-metastore",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/hive-metastore-0.0.14/hive-metastore-0.0.14.tgz",
                    ],
                    "version": "0.0.14",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "spark-history specific configuration",
                                "properties": {
                                    "warehouseDir": {
                                        "type": "string",
                                        "description": "directory of access logs",
                                        "default": "/user/hive/warehouse/",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "s3a://{{user.idep}}/hive-warehouse",
                                        },
                                    },
                                    "image": {
                                        "type": "object",
                                        "description": "image docker",
                                        "properties": {
                                            "tag": {
                                                "type": "string",
                                                "description": "tag",
                                                "default": "master",
                                                "enum": ["master", "custom-spark"],
                                            },
                                        },
                                    },
                                },
                            },
                            "global": {
                                "type": "object",
                                "description": "postgres specific configuration",
                                "title": "Database",
                                "properties": {
                                    "postgresql": {
                                        "type": "object",
                                        "description": "postgres specific configuration",
                                        "title": "Database",
                                        "properties": {
                                            "postgresqlUsername": {
                                                "type": "string",
                                                "title": "Admin user",
                                                "default": "admin",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.idep}}",
                                                },
                                            },
                                            "postgresqlPassword": {
                                                "type": "string",
                                                "title": "Password",
                                                "default": "changeme",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.password}}",
                                                },
                                            },
                                            "postgresqlDatabase": {
                                                "type": "string",
                                                "description":
                                                    "Name for the default database that is created when the image is first started.",
                                                "title": "Database",
                                                "default": "metastore",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                    "dependencies": [
                        {
                            "enabled": true,
                            "name": "postgresql",
                            "repository": "https://charts.bitnami.com/bitnami",
                            "version": "10.3.14",
                        },
                    ],
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-04-14T22:12:40.894588616Z",
                    "description":
                        "Jupyter is a notebook accessible through a web browser. It allows you to run multiple interpreters.",
                    "digest":
                        "6b9ce4639f6b8e7637eeb6c440f0d496a2d4f498a6b6634d753787118cfb09f1",
                    "icon": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4-b_P-Dhd_yGiQ_lhW5TnUqUr_RSvqzRA9SFnUHgLqW38jqVrqMYeDw",
                    "name": "jupyter",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/jupyter-0.3.11/jupyter-0.3.11.tgz",
                    ],
                    "version": "0.3.11",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "jupyter",
                                            "name": "ihm",
                                        },
                                    },
                                    "sparkHostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "jupyter",
                                            "name": "sparkui",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "jupyter",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "spark-history specific configuration",
                                "properties": {
                                    "sparkui": {
                                        "type": "boolean",
                                        "description": "enable",
                                        "default": false,
                                    },
                                    "image": {
                                        "type": "object",
                                        "description": "image docker",
                                        "properties": {
                                            "tag": {
                                                "type": "string",
                                                "description": "tag",
                                                "default": "master",
                                                "enum": ["master", "custom-spark"],
                                            },
                                        },
                                    },
                                },
                            },
                            "discovery": {
                                "type": "object",
                                "description":
                                    "configure your service to autodetect some ressources.",
                                "properties": {
                                    "hive": {
                                        "type": "boolean",
                                        "description":
                                            "discover your hive metastore service",
                                        "title": "Enable hive metastore discovery",
                                        "default": true,
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-04-23T16:02:12.35610727Z",
                    "description":
                        "MLflow is an open source platform to manage the ML lifecycle, including experimentation, reproducibility, deployment, and a central model registry.",
                    "digest":
                        "bb8d994e73d92a02077a4a6aff75e0161363f5565955c5f9eec444a924b654f8",
                    "icon": "https://mlflow.org/images/MLflow-logo-final-white-TM.png",
                    "name": "mlflow",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/mlflow-0.0.6/mlflow-0.0.6.tgz",
                    ],
                    "version": "0.0.6",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "mlflow",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "mlflow artifact repository configuration",
                                "properties": {
                                    "directory": {
                                        "type": "string",
                                        "description":
                                            "directory of artifact root repository",
                                        "default": "/tmp/mlflow/artifacts/",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value":
                                                "s3://{{user.idep}}/mlflow-artifacts",
                                        },
                                    },
                                },
                            },
                            "global": {
                                "type": "object",
                                "description": "postgres specific configuration",
                                "title": "Database",
                                "properties": {
                                    "postgresql": {
                                        "type": "object",
                                        "description": "postgres specific configuration",
                                        "title": "Database",
                                        "properties": {
                                            "postgresqlUsername": {
                                                "type": "string",
                                                "title": "Admin user",
                                                "default": "admin",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.idep}}",
                                                },
                                            },
                                            "postgresqlPassword": {
                                                "type": "string",
                                                "title": "Password",
                                                "default": "changeme",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.password}}",
                                                },
                                            },
                                            "postgresqlDatabase": {
                                                "type": "string",
                                                "description":
                                                    "Name for the default database that is created when the image is first started.",
                                                "title": "Database",
                                                "default": "mlflow",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                    "dependencies": [
                        {
                            "enabled": true,
                            "name": "postgresql",
                            "repository": "https://charts.bitnami.com/bitnami",
                            "version": "10.3.14",
                        },
                    ],
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-08T13:05:24.876848367Z",
                    "description":
                        "Neo4j is a graph database management system developed by Neo4j, Inc. Described by its developers as an ACID-compliant transactional database with native graph storage and processing.",
                    "digest":
                        "daa2875dee365316bbe09859f1beff0955ef36a49b27b6d6c17f7d352d66770c",
                    "icon": "https://humancoders-formations.s3.amazonaws.com/uploads/course/logo/23/thumb_bigger_formation-neo4j.png",
                    "name": "neo4j",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/neo4j-0.2.2/neo4j-0.2.2.tgz",
                    ],
                    "version": "0.2.2",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostnameUI": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "neo4j",
                                            "name": "ihm",
                                        },
                                    },
                                    "hostnameBolt": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "neo4j",
                                            "name": "bolt",
                                        },
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "2Gi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-01-16T10:00:18.13545584Z",
                    "description":
                        "OpenRefine (previously Google Refine) is a powerful tool for working with messy data, cleaning it; transforming it from one format into another; and extending it with web services and external data.",
                    "digest":
                        "338ace150ea7e8b157d8b370e9dbbd3edd843df39a2bee82ca446d9680a5ce6a",
                    "icon": "https://upload.wikimedia.org/wikipedia/commons/7/76/Google-refine-logo.svg",
                    "name": "openrefine",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/openrefine-0.1.6/openrefine-0.1.6.tgz",
                    ],
                    "version": "0.1.6",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "openrefine",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "2Gi",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-04-01T08:27:48.864375561Z",
                    "description":
                        "Outil d'administration de bases de données PostgreSQL",
                    "digest":
                        "befd4c906a756084ef3411ed997a3d4d9b3bae215b7d875f25adae71b3d1d293",
                    "name": "pgadmin",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/pgadmin-0.2.7/pgadmin-0.2.7.tgz",
                    ],
                    "version": "0.2.7",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "rstudio",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "mail": {
                                        "type": "string",
                                        "title": "Login",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.email}}",
                                        },
                                    },
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "discovery": {
                                "type": "object",
                                "description":
                                    "configure your service to autodetect some ressources.",
                                "properties": {
                                    "postgres": {
                                        "type": "boolean",
                                        "description": "discover your postgres service",
                                        "title": "Enable postgres discovery",
                                        "default": true,
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "256Mi",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-04-22T20:11:54.82995149Z",
                    "description":
                        "An object-relational database management system, a database server",
                    "digest":
                        "ad05db5e8a9e8befbab256795fefb45296a22cc8d1fc36eb1b158a6b795c75b4",
                    "icon": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Postgresql_elephant.svg/langfr-220px-Postgresql_elephant.svg.png",
                    "name": "postgresql",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/postgresql-0.0.3/postgresql-0.0.3.tgz",
                    ],
                    "version": "0.0.3",
                    "config": {
                        "type": "object",
                        "properties": {
                            "replication": {
                                "type": "object",
                                "title": "Replication Details",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "title": "Enable Replication",
                                    },
                                    "readReplicas": {
                                        "type": "integer",
                                        "title": "read Replicas",
                                    },
                                },
                            },
                            "postgresqlUsername": {
                                "type": "string",
                                "title": "Admin user",
                            },
                            "persistence": {
                                "type": "object",
                                "properties": {
                                    "size": {
                                        "type": "string",
                                        "title": "Persistent Volume Size",
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description": "Configure resource requests",
                                "title": "Required Resources",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "properties": {
                                            "memory": {
                                                "type": "string",
                                                "title": "Memory Request",
                                            },
                                            "cpu": {
                                                "type": "string",
                                                "title": "CPU Request",
                                            },
                                        },
                                    },
                                },
                            },
                            "metrics": {
                                "type": "object",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "title": "Configure metrics exporter",
                                    },
                                },
                            },
                            "volumePermissions": {
                                "type": "object",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description":
                                            "Change the owner of the persist volume mountpoint to RunAsUser:fsGroup",
                                        "title": "Enable Init Containers",
                                    },
                                },
                            },
                            "postgresqlPassword": {
                                "type": "string",
                                "title": "Password",
                            },
                        },
                    },
                    "type": "application",
                    "dependencies": [
                        {
                            "enabled": true,
                            "name": "postgresql",
                            "repository": "https://charts.bitnami.com/bitnami",
                            "version": "10.3.14",
                        },
                    ],
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-01-16T10:00:18.369737523Z",
                    "description":
                        "The RAPIDS suite of open source software libraries and APIs gives you the ability to execute end-to-end data science and analytics pipelines entirely on GPUs. Licensed under Apache 2.0, RAPIDS is incubated by NVIDIA based on extensive hardware and data science science experience. RAPIDS utilizes NVIDIA CUDA primitives for low-level compute optimization, and exposes GPU parallelism and high-bandwidth memory speed through user-friendly Python interfaces. RAPIDS also focuses on common data preparation tasks for analytics and data science. This includes a familiar dataframe API that integrates with a variety of machine learning algorithms for end-to-end pipeline accelerations without paying typical serialization costs. RAPIDS also includes support for multi-node, multi-GPU deployments, enabling vastly accelerated processing and training on much larger dataset sizes.",
                    "digest":
                        "17d088a7b86cc9a14ebfeccedff0f604f1917d43b247130f090e415a9eaccc67",
                    "icon": "https://cdn-images-1.medium.com/max/1200/1*0jBgSuZf2y8g7JOvWQjsVg.png",
                    "name": "rapidsai",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/rapidsai-0.1.6/rapidsai-0.1.6.tgz",
                    ],
                    "version": "0.1.6",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "rapidsai",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "rapidsai",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "limits": {
                                        "type": "object",
                                        "description": "No limit for cpu and memory",
                                        "properties": {
                                            "nvidia.com/gpu": {
                                                "type": "number",
                                                "description":
                                                    "GPU to allocate to this instance. This is also requested",
                                                "minimum": "0",
                                                "default": 0,
                                            },
                                        },
                                    },
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-04-22T13:02:36.338001152Z",
                    "description":
                        "Redash is an open source tool built for teams to query, visualize and collaborate.",
                    "digest":
                        "abce47d01e9fd570c17d75d18f84d43b7ad5f67fffcfeba2f97c05155d2469a5",
                    "icon": "https://redash.io/assets/images/elements/redash-logo.svg",
                    "name": "redash",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/redash-0.0.7/redash-0.0.7.tgz",
                    ],
                    "version": "0.0.7",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "redash",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "redash": {
                                "type": "object",
                                "description": "postgres specific configuration",
                                "title": "Database",
                                "properties": {
                                    "redash": {
                                        "type": "object",
                                        "description": "redash specific configuration",
                                        "title": "redash",
                                        "properties": {
                                            "cookieSecret": {
                                                "type": "string",
                                                "title": "Admin user",
                                                "default": "admin",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.password}}",
                                                },
                                            },
                                            "secretKey": {
                                                "type": "string",
                                                "title": "Password",
                                                "default": "changeme",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.password}}",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            "global": {
                                "type": "object",
                                "description": "postgres specific configuration",
                                "title": "Database",
                                "properties": {
                                    "postgresql": {
                                        "type": "object",
                                        "description": "postgres specific configuration",
                                        "title": "Database",
                                        "properties": {
                                            "postgresqlUsername": {
                                                "type": "string",
                                                "title": "Admin user",
                                                "default": "admin",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.idep}}",
                                                },
                                            },
                                            "postgresqlPassword": {
                                                "type": "string",
                                                "title": "Password",
                                                "default": "changeme",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.password}}",
                                                },
                                            },
                                            "postgresqlDatabase": {
                                                "type": "string",
                                                "description":
                                                    "Name for the default database that is created when the image is first started.",
                                                "title": "Database",
                                                "default": "redash",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                    "dependencies": [
                        {
                            "enabled": true,
                            "name": "redash",
                            "repository":
                                "https://getredash.github.io/contrib-helm-chart/",
                            "version": "2.3.0",
                        },
                        {
                            "enabled": true,
                            "name": "postgresql",
                            "repository": "https://charts.bitnami.com/bitnami",
                            "version": "10.3.14",
                        },
                    ],
                },
                {
                    "apiVersion": "v2",
                    "created": "2021-04-24T21:09:46.913490501Z",
                    "description": "RStudio is the reference IDE for RLang programming.",
                    "digest":
                        "3497f448f2f182e476ea322e4964d78ccbf2d1ada0363159cf42129d5019f508",
                    "icon": "https://secure.gravatar.com/avatar/5809d093183fe6ca0174066078054949.jpg",
                    "name": "rstudio",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/rstudio-0.4.0/rstudio-0.4.0.tgz",
                    ],
                    "version": "0.4.0",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "rstudio",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "rstudio",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "r": {
                                "type": "object",
                                "description": "rstudio specific configuration",
                                "properties": {
                                    "version": {
                                        "type": "string",
                                        "description": "r version",
                                        "default": "inseefrlab/rstudio:4.0.4",
                                        "enum": [
                                            "inseefrlab/rstudio:3.6.3",
                                            "inseefrlab/rstudio:4.0.4",
                                            "inseefrlab/utilitr:latest",
                                        ],
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "RStudio specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-01-28T10:13:00.548940828Z",
                    "description":
                        "Spark history help you to review logs of your spark applications.",
                    "digest":
                        "ce0b764a02e0e26b1e9e7f18609c13950954225d071c8dd4b26c46b14f350152",
                    "icon": "https://downloads.mesosphere.com/assets/universe/000/spark-history-icon-small.png",
                    "name": "spark-history",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/spark-history-0.0.4/spark-history-0.0.4.tgz",
                    ],
                    "version": "0.0.4",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "spark-history",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "spark-history",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "spark-history specific configuration",
                                "properties": {
                                    "directory": {
                                        "type": "string",
                                        "description": "directory of access logs",
                                        "default": "file://tmp/spark-logs/",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "s3a://{{user.idep}}/spark-history",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "1",
                    "created": "2021-03-19T15:04:05.958315703Z",
                    "description":
                        "Spark SQL can also act as a distributed query engine using its JDBC/ODBC or command-line interface. In this mode, end-users or applications can interact with Spark SQL directly to run SQL queries, without the need to write any code. The Thrift JDBC/ODBC server implemented here corresponds to the HiveServer2 in built-in Hive. You can test the JDBC server with the beeline script that comes with either Spark or compatible Hive.",
                    "digest":
                        "dbe97263060589c275c32973f194c446bbbc1b9634b17b64e1343df8f4e0577c",
                    "icon": "https://downloads.mesosphere.com/assets/universe/000/spark-history-icon-small.png",
                    "name": "spark-thrift-server",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/spark-thrift-server-0.0.11/spark-thrift-server-0.0.11.tgz",
                    ],
                    "version": "0.0.11",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "jupyter",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "spark-history specific configuration",
                                "properties": {
                                    "image": {
                                        "type": "object",
                                        "description": "image docker",
                                        "properties": {
                                            "tag": {
                                                "type": "string",
                                                "description": "tag",
                                                "default": "master",
                                                "enum": ["master", "custom-spark"],
                                            },
                                        },
                                    },
                                },
                            },
                            "discovery": {
                                "type": "object",
                                "description":
                                    "configure your service to autodetect some ressources.",
                                "properties": {
                                    "hive": {
                                        "type": "boolean",
                                        "description":
                                            "discover your hive metastore service",
                                        "title": "Enable hive metastore discovery",
                                        "default": true,
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-04T13:15:08.196585751Z",
                    "description":
                        "TensorFlow is a free and open-source software library for dataflow and differentiable programming across a range of tasks. It is a symbolic math library, and is also used for machine learning applications such as neural networks. Jupyter is a notebook accessible through a web browser.",
                    "digest":
                        "4d4a114341f8888239ba2ee0fd1d9e9f8450349880e83e64ecf46f58bdad4e5c",
                    "icon": "https://www.silicon.fr/wp-content/uploads/2019/10/TensorFlow_.png",
                    "name": "tensorflow",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/tensorflow-0.2.7/tensorflow-0.2.7.tgz",
                    ],
                    "version": "0.2.7",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "tensorflow",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "tensorflow",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "security specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "limits": {
                                        "type": "object",
                                        "description": "No limit for cpu and memory",
                                        "properties": {
                                            "nvidia.com/gpu": {
                                                "type": "number",
                                                "description":
                                                    "GPU to allocate to this instance. This is also requested",
                                                "minimum": "0",
                                                "default": 0,
                                            },
                                        },
                                    },
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-04T13:15:08.46954041Z",
                    "description": "VNC remote desktop.",
                    "digest":
                        "6d71cfadfe511fbae2188b58440b75d63686c203d84c728deaad2a0c42a68d62",
                    "icon": "https://cdn.icon-icons.com/icons2/1508/PNG/512/distributorlogoubuntu_103999.png",
                    "name": "ubuntu",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/ubuntu-0.1.14/ubuntu-0.1.14.tgz",
                    ],
                    "version": "0.1.14",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "ubuntu",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "ubuntu",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "RStudio specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "limits": {
                                        "type": "object",
                                        "description": "No limit for cpu and memory",
                                        "properties": {
                                            "nvidia.com/gpu": {
                                                "type": "number",
                                                "description":
                                                    "GPU to allocate to this instance. This is also requested",
                                                "minimum": "0",
                                                "default": 0,
                                            },
                                        },
                                    },
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-03-19T20:46:44.210784295Z",
                    "description": "Visual studio code, from the browser !",
                    "digest":
                        "79b5f981294a46203cc01f97b7a4f5612659cc3d4a7c02b8386afb2bdc58e40f",
                    "icon": "https://code.visualstudio.com/favicon.ico",
                    "name": "vscode",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/vscode-0.3.8/vscode-0.3.8.tgz",
                    ],
                    "version": "0.3.8",
                    "config": {
                        "type": "object",
                        "properties": {
                            "s3": {
                                "type": "object",
                                "description": "Configuration of temporary identity",
                                "properties": {
                                    "accessKeyId": {
                                        "type": "string",
                                        "description": "AWS Access Key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                                        },
                                    },
                                    "endpoint": {
                                        "type": "string",
                                        "description": "AWS S3 Endpoint",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                                        },
                                    },
                                    "defaultRegion": {
                                        "type": "string",
                                        "description": "AWS S3 default region",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                                        },
                                    },
                                    "secretAccessKey": {
                                        "type": "string",
                                        "description": "AWS S3 secret access key",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                                        },
                                    },
                                    "sessionToken": {
                                        "type": "string",
                                        "description": "AWS S3 session Token",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                                        },
                                    },
                                },
                            },
                            "kubernetes": {
                                "type": "object",
                                "description": "configuration of your kubernetes access",
                                "properties": {
                                    "enable": {
                                        "type": "boolean",
                                        "description":
                                            "allow your service to access your namespace ressources",
                                        "default": true,
                                    },
                                    "role": {
                                        "type": "string",
                                        "description":
                                            "bind your service account to this kubernetes default role",
                                        "default": "view",
                                        "enum": ["view", "edit", "admin"],
                                    },
                                },
                            },
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "rstudio",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "init": {
                                "type": "object",
                                "description": "Init parameters",
                                "properties": {
                                    "standardInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "initScript",
                                            "scope": "vscode",
                                        },
                                    },
                                    "personnalInit": {
                                        "type": "string",
                                        "description": "initialization script",
                                        "default": "",
                                    },
                                },
                            },
                            "security": {
                                "type": "object",
                                "description": "RStudio specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                    "whitelist": {
                                        "type": "object",
                                        "description": "IP protection",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only the configured set of IPs will be able to reach the service",
                                                "title": "Enable IP protection",
                                                "default": true,
                                            },
                                            "ip": {
                                                "type": "string",
                                                "description":
                                                    "the white list of IP is whitespace",
                                                "title": "Whitelist of IP",
                                                "x-form": {
                                                    "hidden": false,
                                                    "readonly": false,
                                                    "value": "{{user.ip}}",
                                                },
                                            },
                                        },
                                    },
                                    "networkPolicy": {
                                        "type": "object",
                                        "description":
                                            "Define access policy to the service",
                                        "properties": {
                                            "enable": {
                                                "type": "boolean",
                                                "description":
                                                    "Only pod from the same namespace will be allowed",
                                                "title": "Enable network policy",
                                                "default": true,
                                            },
                                        },
                                    },
                                },
                            },
                            "environment": {
                                "type": "object",
                                "description":
                                    "configuration of your environment variables",
                                "properties": {
                                    "s3": {
                                        "type": "boolean",
                                        "description":
                                            "Add S3 temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "vault": {
                                        "type": "boolean",
                                        "description":
                                            "Add vault temporary identity inside your environment",
                                        "default": true,
                                    },
                                    "git": {
                                        "type": "boolean",
                                        "description":
                                            "Add git config inside your environment",
                                        "default": true,
                                    },
                                },
                            },
                            "git": {
                                "type": "object",
                                "description": "Git user configuration",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "user name for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.name}}",
                                        },
                                    },
                                    "email": {
                                        "type": "string",
                                        "description": "user email for git",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": true,
                                            "value": "{{git.email}}",
                                        },
                                    },
                                    "cache": {
                                        "type": "string",
                                        "description":
                                            "duration in seconds of the credentials cache duration",
                                        "default": "",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{git.credentials_cache_duration}}",
                                        },
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "service specific configuration",
                                "properties": {
                                    "image": {
                                        "type": "object",
                                        "description":
                                            "service image specific configuration",
                                        "properties": {
                                            "repository": {
                                                "type": "string",
                                                "description": "Version of vscode to use",
                                                "default":
                                                    "inseefrlab/vscode-python:3.9.0",
                                                "enum": [
                                                    "inseefrlab/vscode-python:3.9.0",
                                                    "codercom/code-server:3.9.0",
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                            "resources": {
                                "type": "object",
                                "description":
                                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                                "properties": {
                                    "requests": {
                                        "type": "object",
                                        "description": "Guaranteed resources",
                                        "properties": {
                                            "cpu": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "0.1",
                                            },
                                            "memory": {
                                                "type": "string",
                                                "description":
                                                    "The amount of cpu guaranteed",
                                                "default": "512Mi",
                                            },
                                        },
                                    },
                                },
                            },
                            "persistence": {
                                "type": "object",
                                "description": "Configuration for persistence",
                                "properties": {
                                    "enabled": {
                                        "type": "boolean",
                                        "description": "Create a persistent volume",
                                        "default": true,
                                    },
                                    "size": {
                                        "type": "string",
                                        "description": "Size of the persistent volume",
                                        "default": "10Gi",
                                    },
                                },
                            },
                            "vault": {
                                "type": "object",
                                "description": "Configuration of vault client",
                                "properties": {
                                    "token": {
                                        "type": "string",
                                        "description": "token vault",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOKEN}}",
                                        },
                                    },
                                    "url": {
                                        "type": "string",
                                        "description": "url of vault server",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_ADDR}}",
                                        },
                                    },
                                    "mount": {
                                        "type": "string",
                                        "description": "mount of the v2 secret engine",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_MOUNT}}",
                                        },
                                    },
                                    "directory": {
                                        "type": "string",
                                        "description": "top level directory",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{vault.VAULT_TOP_DIR}}",
                                        },
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description":
                                            "the path of the secret to convert into a list of environment variables",
                                        "default": "",
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
            ],
            "apiVersion": "v1",
            "generated": "2020-05-06T13:56:43.58613877Z",
        },
        "id": "inseefrlab-helm-charts-datascience",
        "name": "Inseefrlab datascience",
        "description":
            "Services for datascientists. https://github.com/InseeFrLab/helm-charts-datascience",
        "maintainer": "innovation@insee.fr",
        "location": "https://inseefrlab.github.io/helm-charts-datascience",
        "status": "PROD",
        "lastUpdateTime": 1619531007482,
        "type": "helm",
    },
    {
        "catalog": {
            "packages": [
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-10T18:36:51.094362162Z",
                    "description":
                        "FuncampR Grimoire. A collection of R tutorials for beginners, with enigmas related to icaRius game.",
                    "digest":
                        "6be09d70d0d6a3b05f3cf83ebd9a140d9063813a58242847f5e7c48bbe29a9b3",
                    "icon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/WPVG_icon_2016.svg/480px-WPVG_icon_2016.svg.png",
                    "name": "grimoire",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-trainings/releases/download/grimoire-0.1.5/grimoire-0.1.5.tgz",
                    ],
                    "version": "0.1.5",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "grimoire",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "grimoire": {
                                "type": "object",
                                "description": "grimoire settings",
                                "properties": {
                                    "chapitre": {
                                        "type": "string",
                                        "description": "Chapter",
                                        "default": "chapitre1",
                                        "enum": [
                                            "chapitre1",
                                            "chapitre2",
                                            "chapitre3",
                                            "chapitre4",
                                            "chapitre5",
                                            "chapitre6",
                                            "chapitre7",
                                            "chapitre8",
                                            "chapitre9",
                                            "chapitre10",
                                            "chapitre11",
                                            "chapitre12",
                                            "chapitre13",
                                            "chapter1",
                                            "chapter2",
                                            "chapter3",
                                            "chapter4",
                                            "chapter5",
                                            "chapter6",
                                            "chapter7",
                                            "chapter8",
                                            "chapter9",
                                            "chapter10",
                                            "chapter11",
                                            "chapter12",
                                            "chapter13",
                                        ],
                                    },
                                    "quete": {
                                        "type": "string",
                                        "description": "Chapitre",
                                        "default": "Grimoire_IGoR",
                                        "enum": ["Grimoire_IGoR", "Spellbook_IGoR"],
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-10T18:36:51.343945982Z",
                    "description":
                        "FuncampR Game. Serious game based on a famous RPG well known in the 90s, dedicated to R learning for beginners.",
                    "digest":
                        "c95487c2047c51ec157a7a148fdf2293b1740f5087f3a7e8d0838e04a6593f25",
                    "icon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/WPVG_icon_2016.svg/480px-WPVG_icon_2016.svg.png",
                    "name": "icarius",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-trainings/releases/download/icarius-0.1.2/icarius-0.1.2.tgz",
                    ],
                    "version": "0.1.2",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "icarius",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                            "service": {
                                "type": "object",
                                "description": "Ubuntu specific configuration",
                                "properties": {
                                    "password": {
                                        "type": "string",
                                        "description": "Password",
                                        "default": "changeme",
                                        "x-form": {
                                            "hidden": false,
                                            "readonly": false,
                                            "value": "{{user.password}}",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
                {
                    "apiVersion": "v2",
                    "appVersion": "latest",
                    "created": "2021-02-10T18:36:51.645717508Z",
                    "description":
                        "FuncampR Grimoire - Last chapter. Final part of a collection of R tutorials for beginners, with enigmas related to icaRius game.",
                    "digest":
                        "39a546f84a9455ba40ec17650cea694d0d005ed9a91cb9010afaf65358fb48c9",
                    "icon": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/WPVG_icon_2016.svg/480px-WPVG_icon_2016.svg.png",
                    "name": "neverending",
                    "urls": [
                        "https://github.com/InseeFrLab/helm-charts-trainings/releases/download/neverending-0.1.1/neverending-0.1.1.tgz",
                    ],
                    "version": "0.1.1",
                    "config": {
                        "type": "object",
                        "properties": {
                            "ingress": {
                                "type": "object",
                                "title": "Ingress Details",
                                "properties": {
                                    "hostname": {
                                        "type": "string",
                                        "title": "Hostname",
                                        "x-form": {
                                            "hidden": true,
                                            "readonly": false,
                                        },
                                        "x-generated": {
                                            "type": "externalDNS",
                                            "scope": "neverending",
                                            "name": "ihm",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "type": "application",
                },
            ],
            "apiVersion": "v1",
            "generated": "2020-11-16T15:53:37.389807246Z",
        },
        "id": "inseefrlab-helm-charts-trainings",
        "name": "Inseefrlab trainings",
        "description":
            "Trainings for datascientists. https://github.com/InseeFrLab/helm-charts-trainings",
        "maintainer": "innovation@insee.fr",
        "location": "https://inseefrlab.github.io/helm-charts-trainings",
        "status": "TEST",
        "lastUpdateTime": 1619531008608,
        "type": "helm",
    },
];

const data2 = {
    "apiVersion": "v2",
    "created": "2021-04-30T08:58:48.076364018Z",
    "description":
        "R Studio is the reference environment / IDE for programming with R, a programming language used for data processing and statistical analysis.",
    "digest": "f7afc72b18e474ee9acf7d17cfeb9885c152e39505e28bdc26ce61883752b133",
    "home": "https://www.rstudio.com/",
    "icon": "https://minio.lab.sspcloud.fr/projet-onyxia/assets/servicesImg/rstudio.png",
    "name": "rstudio",
    "sources": [
        "https://github.com/InseeFrLab/rstudio",
        "https://github.com/InseeFrLab/helm-charts-datascience/tree/master/charts/rstudio",
        "https://github.com/rocker-org/rocker",
    ],
    "urls": [
        "https://github.com/InseeFrLab/helm-charts-datascience/releases/download/rstudio-1.0.1/rstudio-1.0.1.tgz",
    ],
    "version": "1.0.1",
    "config": {
        "type": "object",
        "properties": {
            "s3": {
                "type": "object",
                "description": "Configuration of temporary identity",
                "properties": {
                    "accessKeyId": {
                        "type": "string",
                        "description": "AWS Access Key",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                            "value": "{{s3.AWS_ACCESS_KEY_ID}}",
                        },
                    },
                    "endpoint": {
                        "type": "string",
                        "description": "AWS S3 Endpoint",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                            "value": "{{s3.AWS_S3_ENDPOINT}}",
                        },
                    },
                    "defaultRegion": {
                        "type": "string",
                        "description": "AWS S3 default region",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                            "value": "{{s3.AWS_DEFAULT_REGION}}",
                        },
                    },
                    "secretAccessKey": {
                        "type": "string",
                        "description": "AWS S3 secret access key",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                            "value": "{{s3.AWS_SECRET_ACCESS_KEY}}",
                        },
                    },
                    "sessionToken": {
                        "type": "string",
                        "description": "AWS S3 session Token",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                            "value": "{{s3.AWS_SESSION_TOKEN}}",
                        },
                    },
                },
            },
            "kubernetes": {
                "type": "object",
                "description": "configuration of your kubernetes access",
                "properties": {
                    "enable": {
                        "type": "boolean",
                        "description":
                            "allow your service to access your namespace ressources",
                        "default": true,
                    },
                    "role": {
                        "type": "string",
                        "description":
                            "bind your service account to this kubernetes default role",
                        "default": "view",
                        "enum": ["view", "edit", "admin"],
                    },
                },
            },
            "ingress": {
                "type": "object",
                "title": "Ingress Details",
                "properties": {
                    "hostname": {
                        "type": "string",
                        "title": "Hostname",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                        },
                        "x-generated": {
                            "type": "externalDNS",
                            "scope": "rstudio",
                            "name": "ihm",
                        },
                    },
                },
            },
            "init": {
                "type": "object",
                "description": "Init parameters",
                "properties": {
                    "standardInit": {
                        "type": "string",
                        "description": "initialization script",
                        "default": "",
                        "x-form": {
                            "hidden": true,
                            "readonly": false,
                        },
                        "x-generated": {
                            "type": "initScript",
                            "scope": "rstudio",
                        },
                    },
                    "personnalInit": {
                        "type": "string",
                        "description": "initialization script",
                        "default": "",
                    },
                },
            },
            "r": {
                "type": "object",
                "description": "rstudio specific configuration",
                "properties": {
                    "version": {
                        "type": "string",
                        "description": "r version",
                        "default": "inseefrlab/rstudio:4.0.4",
                        "enum": [
                            "inseefrlab/rstudio:3.6.3",
                            "inseefrlab/rstudio:4.0.4",
                            "inseefrlab/utilitr:latest",
                        ],
                    },
                },
            },
            "security": {
                "type": "object",
                "description": "RStudio specific configuration",
                "properties": {
                    "password": {
                        "type": "string",
                        "description": "Password",
                        "default": "changeme",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{user.password}}",
                        },
                    },
                    "whitelist": {
                        "type": "object",
                        "description": "IP protection",
                        "properties": {
                            "enable": {
                                "type": "boolean",
                                "description":
                                    "Only the configured set of IPs will be able to reach the service",
                                "title": "Enable IP protection",
                                "default": true,
                            },
                            "ip": {
                                "type": "string",
                                "description": "the white list of IP is whitespace",
                                "title": "Whitelist of IP",
                                "x-form": {
                                    "hidden": false,
                                    "readonly": false,
                                    "value": "{{user.ip}}",
                                },
                            },
                        },
                    },
                    "networkPolicy": {
                        "type": "object",
                        "description": "Define access policy to the service",
                        "properties": {
                            "enable": {
                                "type": "boolean",
                                "description":
                                    "Only pod from the same namespace will be allowed",
                                "title": "Enable network policy",
                                "default": true,
                            },
                        },
                    },
                },
            },
            "environment": {
                "type": "object",
                "description": "configuration of your environment variables",
                "properties": {
                    "s3": {
                        "type": "boolean",
                        "description":
                            "Add S3 temporary identity inside your environment",
                        "default": true,
                    },
                    "vault": {
                        "type": "boolean",
                        "description":
                            "Add vault temporary identity inside your environment",
                        "default": true,
                    },
                    "git": {
                        "type": "boolean",
                        "description": "Add git config inside your environment",
                        "default": true,
                    },
                },
            },
            "git": {
                "type": "object",
                "description": "Git user configuration",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "user name for git",
                        "default": "",
                        "x-form": {
                            "hidden": false,
                            "readonly": true,
                            "value": "{{git.name}}",
                        },
                    },
                    "email": {
                        "type": "string",
                        "description": "user email for git",
                        "default": "",
                        "x-form": {
                            "hidden": false,
                            "readonly": true,
                            "value": "{{git.email}}",
                        },
                    },
                    "cache": {
                        "type": "string",
                        "description":
                            "duration in seconds of the credentials cache duration",
                        "default": "",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{git.credentials_cache_duration}}",
                        },
                    },
                },
            },
            "onyxia": {
                "type": "object",
                "description": "Onyxia specific configuration",
                "properties": {
                    "friendlyName": {
                        "type": "string",
                        "description": "Service custom name",
                        "title": "Custom name",
                        "default": "rstudio",
                    },
                },
            },
            "resources": {
                "type": "object",
                "description":
                    "Your service will have at least the requested resources and never more than its limits. No limit for a resource and you can consume everything left on the host machine.",
                "properties": {
                    "requests": {
                        "type": "object",
                        "description": "Guaranteed resources",
                        "properties": {
                            "cpu": {
                                "type": "string",
                                "description": "The amount of cpu guaranteed",
                                "default": "0.1",
                            },
                            "memory": {
                                "type": "string",
                                "description": "The amount of cpu guaranteed",
                                "default": "512Mi",
                            },
                        },
                    },
                },
            },
            "persistence": {
                "type": "object",
                "description": "Configuration for persistence",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "Create a persistent volume",
                        "default": true,
                    },
                    "size": {
                        "type": "string",
                        "description": "Size of the persistent volume",
                        "default": "10Gi",
                    },
                },
            },
            "vault": {
                "type": "object",
                "description": "Configuration of vault client",
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "token vault",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{vault.VAULT_TOKEN}}",
                        },
                    },
                    "url": {
                        "type": "string",
                        "description": "url of vault server",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{vault.VAULT_ADDR}}",
                        },
                    },
                    "mount": {
                        "type": "string",
                        "description": "mount of the v2 secret engine",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{vault.VAULT_MOUNT}}",
                        },
                    },
                    "directory": {
                        "type": "string",
                        "description": "top level directory",
                        "x-form": {
                            "hidden": false,
                            "readonly": false,
                            "value": "{{vault.VAULT_TOP_DIR}}",
                        },
                    },
                    "secret": {
                        "type": "string",
                        "description":
                            "the path of the secret to convert into a list of environment variables",
                        "default": "",
                    },
                },
            },
        },
    },
    "type": "application",
};
