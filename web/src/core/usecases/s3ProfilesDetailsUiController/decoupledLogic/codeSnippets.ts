export const technologies = [
    "AWS CLI / shared profile",
    "MinIO Client (bash)",
    "Python (boto3)",
    "Python (s3fs)",
    "Python (polars)",
    "Python (pyarrow)",
    "DuckDB",
    "R (aws.s3)",
    "R (arrow)",
    "R (paws)",
    "rclone"
] as const;

export type Technology = (typeof technologies)[number];

export type CodeSnippet = {
    fileBasename: string;
    codeSrc: string;
};

type AccessCredentials =
    | {
          accessKeyId: string;
          secretAccessKey: string;
          sessionToken: string | undefined;
      }
    | undefined;

type SnippetContext = {
    profileName: string;
    profileNameForShell: string;
    region: string;
    endpointOrigin: string;
    endpointAuthority: string;
    endpointScheme: "http" | "https";
    awsConfigSectionName: string;
    awsServiceSectionName: string;
    minioClientAlias: string;
    minioClientEnvVarName: string;
    rcloneRemoteName: string;
    accessCredentials: AccessCredentials;
};

const defaultRegionFallback = "us-east-1";

export function getCodeSnippet(params: {
    technology: Technology;
    profileName: string;
    endpointUrl: string;
    defaultRegion: string | undefined;
    accessCredentials: AccessCredentials;
}): CodeSnippet {
    const { technology } = params;

    const context = getSnippetContext(params);

    const snippetFactories = {
        "AWS CLI / shared profile": getAwsCliSnippet,
        "MinIO Client (bash)": getMinioClientSnippet,
        "Python (boto3)": getBoto3Snippet,
        "Python (s3fs)": getS3fsSnippet,
        "Python (polars)": getPolarsSnippet,
        "Python (pyarrow)": getPyArrowSnippet,
        DuckDB: getDuckDbSnippet,
        "R (aws.s3)": getRAwsS3Snippet,
        "R (arrow)": getRArrowSnippet,
        "R (paws)": getRPawsSnippet,
        rclone: getRcloneSnippet
    } satisfies Record<Technology, (context: SnippetContext) => CodeSnippet>;

    return snippetFactories[technology](context);
}

function getSnippetContext(params: {
    profileName: string;
    endpointUrl: string;
    defaultRegion: string | undefined;
    accessCredentials: AccessCredentials;
}): SnippetContext {
    const { profileName, endpointUrl, defaultRegion, accessCredentials } = params;

    const normalizedEndpointUrl = normalizeEndpointUrl(endpointUrl);
    const parsedEndpointUrl = new URL(normalizedEndpointUrl);
    const minioClientAlias = toMinioClientAlias(profileName);

    return {
        profileName,
        profileNameForShell: shellQuote(profileName),
        region: defaultRegion ?? defaultRegionFallback,
        endpointOrigin: parsedEndpointUrl.origin,
        endpointAuthority: parsedEndpointUrl.host,
        endpointScheme: parsedEndpointUrl.protocol === "http:" ? "http" : "https",
        awsConfigSectionName:
            profileName === "default" ? "default" : `profile ${profileName}`,
        awsServiceSectionName: `${toSafeIdentifier(profileName, "-")}-s3`,
        minioClientAlias,
        minioClientEnvVarName: `MC_HOST_${minioClientAlias}`,
        rcloneRemoteName: toSafeIdentifier(profileName, "-"),
        accessCredentials
    };
}

function getAwsCliSnippet(context: SnippetContext): CodeSnippet {
    const { accessCredentials } = context;

    if (accessCredentials === undefined) {
        return {
            fileBasename: "public-bucket-aws-cli.sh",
            codeSrc: trimCode(`
                # Public buckets do not need a shared AWS credentials profile.
                # Replace "your-bucket" with the bucket you want to inspect.
                aws s3 ls \\
                  --endpoint-url ${shellQuote(context.endpointOrigin)} \\
                  --region ${shellQuote(context.region)} \\
                  --no-sign-request \\
                  s3://your-bucket/
            `)
        };
    }

    return {
        fileBasename: "setup-aws-profile.sh",
        codeSrc: trimCode(`
            mkdir -p ~/.aws

            cat > ~/.aws/credentials <<'EOF'
            [${context.profileName}]
            aws_access_key_id = ${accessCredentials.accessKeyId}
            aws_secret_access_key = ${accessCredentials.secretAccessKey}${
                accessCredentials.sessionToken === undefined
                    ? ""
                    : `
            aws_session_token = ${accessCredentials.sessionToken}`
            }
            EOF

            cat > ~/.aws/config <<'EOF'
            [${context.awsConfigSectionName}]
            region = ${context.region}
            services = ${context.awsServiceSectionName}

            [services ${context.awsServiceSectionName}]
            s3 =
              endpoint_url = ${context.endpointOrigin}
            EOF

            export AWS_PROFILE=${context.profileNameForShell}

            aws s3 ls --profile ${context.profileNameForShell}
        `)
    };
}

function getMinioClientSnippet(context: SnippetContext): CodeSnippet {
    const { accessCredentials } = context;

    if (accessCredentials === undefined) {
        return {
            fileBasename: "public-bucket-mc.sh",
            codeSrc: trimCode(`
                # MinIO Client aliases require access and secret keys.
                # For anonymous public buckets, use the AWS CLI / shared profile snippet
                # or select a credentialed profile and regenerate this snippet.
            `)
        };
    }

    const { sessionToken } = accessCredentials;

    if (sessionToken !== undefined) {
        return {
            fileBasename: "setup-mc-alias.sh",
            codeSrc: trimCode(`
                # Re-run this export when the session token is renewed.
                export ${context.minioClientEnvVarName}=${shellQuote(
                    getMinioClientHostUrl({
                        context,
                        accessCredentials: {
                            ...accessCredentials,
                            sessionToken
                        }
                    })
                )}

                mc ls ${shellQuote(`${context.minioClientAlias}/your-bucket`)}
            `)
        };
    }

    return {
        fileBasename: "setup-mc-alias.sh",
        codeSrc: trimCode(`
            mc alias set \\
              ${shellQuote(context.minioClientAlias)} \\
              ${shellQuote(context.endpointOrigin)} \\
              ${shellQuote(accessCredentials.accessKeyId)} \\
              ${shellQuote(accessCredentials.secretAccessKey)} \\
              --api S3v4

            mc ls ${shellQuote(context.minioClientAlias)}
            mc ls ${shellQuote(`${context.minioClientAlias}/your-bucket`)}
        `)
    };
}

function getBoto3Snippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.py",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    import boto3
                    from botocore import UNSIGNED
                    from botocore.config import Config

                    s3 = boto3.client(
                        "s3",
                        endpoint_url=${JSON.stringify(context.endpointOrigin)},
                        region_name=${JSON.stringify(context.region)},
                        config=Config(signature_version=UNSIGNED),
                    )

                    bucket = "your-bucket"
                    response = s3.list_objects_v2(Bucket=bucket, MaxKeys=10)
                    print([item["Key"] for item in response.get("Contents", [])])
                `)
                : trimCode(`
                    import boto3

                    # Preferred: create the shared AWS profile once, then reuse it here.
                    session = boto3.Session(profile_name=${JSON.stringify(context.profileName)})

                    s3 = session.client(
                        "s3",
                        endpoint_url=${JSON.stringify(context.endpointOrigin)},
                        region_name=${JSON.stringify(context.region)},
                    )

                    bucket = "your-bucket"
                    response = s3.list_objects_v2(Bucket=bucket, MaxKeys=10)
                    print([item["Key"] for item in response.get("Contents", [])])
                `)
    };
}

function getS3fsSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.py",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    import s3fs

                    fs = s3fs.S3FileSystem(
                        anon=True,
                        endpoint_url=${JSON.stringify(context.endpointOrigin)},
                        client_kwargs={"region_name": ${JSON.stringify(context.region)}},
                    )

                    print(fs.ls("your-bucket"))
                `)
                : trimCode(`
                    import s3fs

                    # Preferred: create the shared AWS profile once, then reuse it here.
                    fs = s3fs.S3FileSystem(
                        profile=${JSON.stringify(context.profileName)},
                        endpoint_url=${JSON.stringify(context.endpointOrigin)},
                        client_kwargs={"region_name": ${JSON.stringify(context.region)}},
                    )

                    print(fs.ls("your-bucket"))
                `)
    };
}

function getPolarsSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.py",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    import polars as pl

                    source = "s3://your-bucket/path/to/dataset/*.parquet"

                    lf = pl.scan_parquet(
                        source,
                        storage_options={
                            "aws_endpoint_url": ${JSON.stringify(context.endpointOrigin)},
                            "aws_region": ${JSON.stringify(context.region)},
                            "aws_skip_signature": True,
                        },
                    )

                    print(lf.limit(5).collect())
                `)
                : trimCode(`
                    import polars as pl

                    source = "s3://your-bucket/path/to/dataset/*.parquet"

                    lf = pl.scan_parquet(
                        source,
                        storage_options={
                            "aws_endpoint_url": ${JSON.stringify(context.endpointOrigin)},
                            "aws_region": ${JSON.stringify(context.region)},
                        },
                        credential_provider=pl.CredentialProviderAWS(
                            profile_name=${JSON.stringify(context.profileName)},
                            region_name=${JSON.stringify(context.region)},
                        ),
                    )

                    print(lf.limit(5).collect())
                `)
    };
}

function getPyArrowSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.py",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    import pyarrow.dataset as ds
                    from pyarrow import fs

                    s3 = fs.S3FileSystem(
                        anonymous=True,
                        region=${JSON.stringify(context.region)},
                        endpoint_override=${JSON.stringify(context.endpointAuthority)},
                        scheme=${JSON.stringify(context.endpointScheme)},
                    )

                    dataset = ds.dataset(
                        "your-bucket/path/to/dataset/",
                        filesystem=s3,
                        format="parquet",
                    )
                    print(dataset.head(5).to_pandas())
                `)
                : trimCode(`
                    import os
                    import pyarrow.dataset as ds
                    from pyarrow import fs

                    # Preferred: create the shared AWS profile once, then reuse it here.
                    os.environ["AWS_PROFILE"] = ${JSON.stringify(context.profileName)}

                    s3 = fs.S3FileSystem(
                        region=${JSON.stringify(context.region)},
                        endpoint_override=${JSON.stringify(context.endpointAuthority)},
                        scheme=${JSON.stringify(context.endpointScheme)},
                    )

                    dataset = ds.dataset(
                        "your-bucket/path/to/dataset/",
                        filesystem=s3,
                        format="parquet",
                    )
                    print(dataset.head(5).to_pandas())
                `)
    };
}

function getDuckDbSnippet(context: SnippetContext): CodeSnippet {
    const secretName = `${toSafeIdentifier(context.profileName, "_")}_s3`;

    return {
        fileBasename: "example.sql",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    INSTALL aws;
                    LOAD aws;

                    -- DuckDB's documented S3 flow is credential-based.
                    -- For public buckets, prefer the Polars, pyarrow, or s3fs snippets,
                    -- which expose an explicit anonymous / unsigned mode.
                `)
                : trimCode(`
                    INSTALL aws;
                    LOAD aws;

                    CREATE OR REPLACE SECRET ${secretName} (
                        TYPE s3,
                        PROVIDER credential_chain,
                        CHAIN config,
                        PROFILE ${toSqlString(context.profileName)},
                        REGION ${toSqlString(context.region)},
                        ENDPOINT ${toSqlString(context.endpointAuthority)},
                        USE_SSL ${context.endpointScheme === "https"}
                    );

                    SELECT *
                    FROM read_parquet('s3://your-bucket/path/to/dataset/*.parquet')
                    LIMIT 10;
                `)
    };
}

function getRAwsS3Snippet(context: SnippetContext): CodeSnippet {
    const awsS3PackageRegion = getAwsS3PackageRegion(context);
    const useHttps = toRBoolean(context.endpointScheme === "https");

    return {
        fileBasename: "example.R",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    install.packages("aws.s3", repos = "https://cloud.r-project.org")

                    Sys.setenv(
                      AWS_S3_ENDPOINT = ${JSON.stringify(context.endpointAuthority)}
                    )

                    library(aws.s3)

                    bucket <- "your-bucket"
                    objects <- get_bucket(
                      bucket = bucket,
                      max = 10,
                      region = ${JSON.stringify(awsS3PackageRegion)},
                      use_https = ${useHttps},
                      key = "",
                      secret = "",
                      session_token = ""
                    )

                    keys <- vapply(objects, function(item) item$Key, character(1))
                    print(keys)
                `)
                : trimCode(`
                    install.packages("aws.s3", repos = "https://cloud.r-project.org")

                    Sys.setenv(
                      AWS_S3_ENDPOINT = ${JSON.stringify(context.endpointAuthority)},
                      AWS_ACCESS_KEY_ID = ${JSON.stringify(
                          context.accessCredentials.accessKeyId
                      )},
                      AWS_SECRET_ACCESS_KEY = ${JSON.stringify(
                          context.accessCredentials.secretAccessKey
                      )}${
                          context.accessCredentials.sessionToken === undefined
                              ? ""
                              : `,
                      AWS_SESSION_TOKEN = ${JSON.stringify(
                          context.accessCredentials.sessionToken
                      )}`
                      }
                    )

                    library(aws.s3)

                    bucket <- "your-bucket"
                    objects <- get_bucket(
                      bucket = bucket,
                      max = 10,
                      region = ${JSON.stringify(awsS3PackageRegion)},
                      use_https = ${useHttps}
                    )

                    keys <- vapply(objects, function(item) item$Key, character(1))
                    print(keys)
                `)
    };
}

function getRArrowSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.R",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    install.packages("arrow", repos = "https://cloud.r-project.org")

                    library(arrow)

                    fs <- S3FileSystem$create(
                      anonymous = TRUE,
                      region = ${JSON.stringify(context.region)},
                      endpoint_override = ${JSON.stringify(context.endpointAuthority)},
                      scheme = ${JSON.stringify(context.endpointScheme)}
                    )

                    dataset <- open_dataset(
                      "your-bucket/path/to/dataset/",
                      filesystem = fs,
                      format = "parquet"
                    )

                    print(head(as.data.frame(dataset)))
                `)
                : trimCode(`
                    install.packages("arrow", repos = "https://cloud.r-project.org")

                    Sys.setenv(AWS_PROFILE = ${JSON.stringify(context.profileName)})
                    library(arrow)

                    fs <- S3FileSystem$create(
                      region = ${JSON.stringify(context.region)},
                      endpoint_override = ${JSON.stringify(context.endpointAuthority)},
                      scheme = ${JSON.stringify(context.endpointScheme)}
                    )

                    dataset <- open_dataset(
                      "your-bucket/path/to/dataset/",
                      filesystem = fs,
                      format = "parquet"
                    )

                    print(head(as.data.frame(dataset)))
                `)
    };
}

function getRPawsSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "example.R",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    install.packages("paws", repos = "https://cloud.r-project.org")

                    library(paws)

                    s3 <- paws::s3(
                      credentials = list(anonymous = TRUE),
                      endpoint = ${JSON.stringify(context.endpointOrigin)},
                      region = ${JSON.stringify(context.region)}
                    )

                    bucket <- "your-bucket"
                    response <- s3$list_objects_v2(Bucket = bucket, MaxKeys = 10)
                    keys <- if (is.null(response$Contents)) character() else {
                      vapply(response$Contents, function(item) item$Key, character(1))
                    }

                    print(keys)
                `)
                : trimCode(`
                    install.packages("paws", repos = "https://cloud.r-project.org")

                    library(paws)

                    # Preferred: create the shared AWS profile once, then reuse it here.
                    s3 <- paws::s3(
                      credentials = list(profile = ${JSON.stringify(context.profileName)}),
                      endpoint = ${JSON.stringify(context.endpointOrigin)},
                      region = ${JSON.stringify(context.region)}
                    )

                    bucket <- "your-bucket"
                    response <- s3$list_objects_v2(Bucket = bucket, MaxKeys = 10)
                    keys <- if (is.null(response$Contents)) character() else {
                      vapply(response$Contents, function(item) item$Key, character(1))
                    }

                    print(keys)
                `)
    };
}

function getRcloneSnippet(context: SnippetContext): CodeSnippet {
    return {
        fileBasename: "rclone.conf",
        codeSrc:
            context.accessCredentials === undefined
                ? trimCode(`
                    [${context.rcloneRemoteName}]
                    type = s3
                    provider = Other
                    env_auth = false
                    region = ${context.region}
                    endpoint = ${context.endpointOrigin}
                    access_key_id =
                    secret_access_key =

                    # Blank keys enable anonymous access for public buckets.
                    # Example: rclone ls ${context.rcloneRemoteName}:your-bucket
                `)
                : trimCode(`
                    [${context.rcloneRemoteName}]
                    type = s3
                    provider = Other
                    env_auth = true
                    profile = ${context.profileName}
                    region = ${context.region}
                    endpoint = ${context.endpointOrigin}

                    # Preferred: reuse the shared AWS profile created once in ~/.aws.
                    # Example: rclone ls ${context.rcloneRemoteName}:your-bucket
                `)
    };
}

function normalizeEndpointUrl(endpointUrl: string): string {
    const trimmed = endpointUrl.trim();

    return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function toSafeIdentifier(value: string, separator: "-" | "_"): string {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, separator)
        .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

    return normalized === "" ? "onyxia" : normalized;
}

function toMinioClientAlias(value: string): string {
    const safeIdentifier = toSafeIdentifier(value, "_");

    return /^[a-z]/.test(safeIdentifier) ? safeIdentifier : `onyxia_${safeIdentifier}`;
}

function toSqlString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function toRBoolean(value: boolean): "TRUE" | "FALSE" {
    return value ? "TRUE" : "FALSE";
}

function getAwsS3PackageRegion(context: SnippetContext): string {
    return context.endpointAuthority === "s3.amazonaws.com" ? context.region : "";
}

function getMinioClientHostUrl(params: {
    context: SnippetContext;
    accessCredentials: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken: string;
    };
}): string {
    const { context, accessCredentials } = params;
    const userInfo = [
        accessCredentials.accessKeyId,
        accessCredentials.secretAccessKey,
        accessCredentials.sessionToken
    ].join(":");

    return `${context.endpointScheme}://${userInfo}@${context.endpointAuthority}`;
}

function trimCode(code: string): string {
    const lines = code.replace(/^\n+|\n+$/g, "").split("\n");
    const indents = lines
        .filter(line => line.trim() !== "")
        .map(line => line.match(/^ */)?.[0].length ?? 0);

    const minIndent = indents.length === 0 ? 0 : Math.min(...indents);

    return lines.map(line => line.slice(minIndent)).join("\n");
}
