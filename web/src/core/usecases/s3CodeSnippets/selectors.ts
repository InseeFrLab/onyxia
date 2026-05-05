import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";

const state = (rootState: RootState) => rootState[name];

const readyState = createSelector(state, state => {
    if (state.stateDescription !== "ready") {
        return null;
    }

    return state;
});

const isReady = createSelector(readyState, state => state !== null);

const selectedTechnology = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.selectedTechnology;
});

const credentials = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.credentials;
});

const initScript = createSelector(
    isReady,
    selectedTechnology,
    credentials,
    (isReady, selectedTechnology, credentials) => {
        if (!isReady) {
            return null;
        }

        assert(selectedTechnology !== null);
        assert(credentials !== null);

        return {
            fileBasename: ((): string => {
                switch (selectedTechnology) {
                    case "R (aws.S3)":
                    case "R (paws)":
                        return "credentials.R";
                    case "Python (s3fs)":
                    case "Python (boto3)":
                    case "Python (polars)":
                        return "credentials.py";
                    case "shell environment variables":
                    case "MC client":
                        return ".bashrc";
                    case "s3cmd":
                        return ".s3cmd";
                    case "rclone":
                        return "rclone.conf";
                }
            })(),
            scriptCode: ((): string => {
                switch (selectedTechnology) {
                    case "R (aws.S3)":
                        return `
install.packages("aws.s3", repos = "https://cloud.R-project.org")

Sys.setenv("AWS_ACCESS_KEY_ID" = "${credentials.AWS_ACCESS_KEY_ID}",
           "AWS_SECRET_ACCESS_KEY" = "${credentials.AWS_SECRET_ACCESS_KEY}",
           "AWS_DEFAULT_REGION" = "${credentials.AWS_DEFAULT_REGION}",
           "AWS_SESSION_TOKEN" = "${credentials.AWS_SESSION_TOKEN}",
           "AWS_S3_ENDPOINT"= "${credentials.AWS_S3_ENDPOINT}")

library(aws.s3)

# Get username
username <- gsub("user-", "", Sys.getenv("KUBERNETES_NAMESPACE"))

# List contents in the user bucket
file_list <- get_bucket(username, region = "")

# List files
file_names <- sapply(file_list, function(x) x$Key)
print(file_names)
`;
                    case "R (paws)":
                        return `
install.packages("paws", repos = "https://cloud.R-project.org")

Sys.setenv("AWS_ACCESS_KEY_ID" = "${credentials.AWS_ACCESS_KEY_ID}",
           "AWS_SECRET_ACCESS_KEY" = "${credentials.AWS_SECRET_ACCESS_KEY}",
           "AWS_DEFAULT_REGION" = "${credentials.AWS_DEFAULT_REGION}",
           "AWS_SESSION_TOKEN" = "${credentials.AWS_SESSION_TOKEN}",
           "AWS_S3_ENDPOINT"= "${credentials.AWS_S3_ENDPOINT}")

library("paws")
minio <- paws::s3(config = list(
	credentials = list(
	  creds = list(
		access_key_id = Sys.getenv("AWS_ACCESS_KEY_ID"),
		secret_access_key = Sys.getenv("AWS_SECRET_ACCESS_KEY"),
		session_token = Sys.getenv("AWS_SESSION_TOKEN")
	  )),
	endpoint = paste0("https://", Sys.getenv("AWS_S3_ENDPOINT")),
	region = Sys.getenv("AWS_DEFAULT_REGION")))
  
# Get username
username <- gsub("user-", "", Sys.getenv("KUBERNETES_NAMESPACE"))

# List contents in the user bucket
response <- minio$list_objects_v2(Bucket = username)

# List files
file_names <- response$Contents |> purrr::map_chr(~ .x$Key)
print(file_names)

						`;
                    case "Python (s3fs)":
                        return `
import os
import s3fs
os.environ["AWS_ACCESS_KEY_ID"] = '${credentials.AWS_ACCESS_KEY_ID}'
os.environ["AWS_SECRET_ACCESS_KEY"] = '${credentials.AWS_SECRET_ACCESS_KEY}'
os.environ["AWS_SESSION_TOKEN"] = '${credentials.AWS_SESSION_TOKEN}'
os.environ["AWS_DEFAULT_REGION"] = '${credentials.AWS_DEFAULT_REGION}'
fs = s3fs.S3FileSystem(
    client_kwargs={'endpoint_url': 'https://'+'${credentials.AWS_S3_ENDPOINT}'},
    key = os.environ["AWS_ACCESS_KEY_ID"], 
    secret = os.environ["AWS_SECRET_ACCESS_KEY"], 
    token = os.environ["AWS_SESSION_TOKEN"])
						`;
                    case "Python (boto3)":
                        return `
import boto3
s3 = boto3.client("s3",endpoint_url = 'https://'+'${credentials.AWS_S3_ENDPOINT}',
                  aws_access_key_id= '${credentials.AWS_ACCESS_KEY_ID}', 
                  aws_secret_access_key= '${credentials.AWS_SECRET_ACCESS_KEY}', 
                  aws_session_token = '${credentials.AWS_SESSION_TOKEN}')
						`;
                    case "Python (polars)":
                        return `
import polars as pl
storage_options = {
    "aws_endpoint":  'https://'+'${credentials.AWS_S3_ENDPOINT}',
    "aws_access_key_id": os.environ["AWS_ACCESS_KEY_ID"],
    "aws_secret_access_key": os.environ["AWS_SECRET_ACCESS_KEY"],
    "aws_region": os.environ["AWS_DEFAULT_REGION"],
    "aws_token": os.environ["AWS_SESSION_TOKEN"]
  }
  # or hard-coded :
  storage_options = {
    "aws_endpoint":  'https://'+'${credentials.AWS_S3_ENDPOINT}',
    "aws_access_key_id": '${credentials.AWS_ACCESS_KEY_ID}', 
    "aws_secret_access_key": '${credentials.AWS_SECRET_ACCESS_KEY}', 
    "aws_region": '${credentials.AWS_DEFAULT_REGION}'
    "aws_token": '${credentials.AWS_SESSION_TOKEN}'
  }
  df = pl.scan_parquet(source = "s3://bucket/*.parquet", storage_options=storage_options)
  print(df)

						`;
                    case "shell environment variables":
                        return `
export AWS_ACCESS_KEY_ID=${credentials.AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${credentials.AWS_SECRET_ACCESS_KEY}
export AWS_DEFAULT_REGION=${credentials.AWS_DEFAULT_REGION}
export AWS_SESSION_TOKEN=${credentials.AWS_SESSION_TOKEN}
export AWS_S3_ENDPOINT=${credentials.AWS_S3_ENDPOINT}
						`;
                    case "MC client":
                        return `
export MC_HOST_s3=https://${credentials.AWS_ACCESS_KEY_ID}:${credentials.AWS_SECRET_ACCESS_KEY}:${credentials.AWS_SESSION_TOKEN}@${credentials.AWS_S3_ENDPOINT}
						`;
                    case "s3cmd":
                        return `
[default]
access_key = ${credentials.AWS_ACCESS_KEY_ID}
access_token = ${credentials.AWS_SESSION_TOKEN}
add_encoding_exts =
add_headers =
bucket_location = us-east-1
ca_certs_file =
cache_file =
check_ssl_certificate = False
check_ssl_hostname = False
cloudfront_host = cloudfront.amazonaws.com
default_mime_type = binary/octet-stream
delay_updates = False
delete_after = False
delete_after_fetch = False
delete_removed = False
dry_run = False
enable_multipart = True
encoding = UTF-8
encrypt = False
expiry_date =
expiry_days =
expiry_prefix =
follow_symlinks = False
force = False
get_continue = False
gpg_command = /usr/bin/gpg
gpg_decrypt = %(gpg_command)s -d --verbose --no-use-agent --batch --yes --passphrase-fd %(passphrase_fd)s -o %(output_file)s %(input_file)s
gpg_encrypt = %(gpg_command)s -c --verbose --no-use-agent --batch --yes --passphrase-fd %(passphrase_fd)s -o %(output_file)s %(input_file)s
gpg_passphrase =
guess_mime_type = True
host_base = ${credentials.AWS_S3_ENDPOINT}
host_bucket = ${credentials.AWS_S3_ENDPOINT}
human_readable_sizes = False
invalidate_default_index_on_cf = False
invalidate_default_index_root_on_cf = True
invalidate_on_cf = False
kms_key =
limitrate = 0
list_md5 = False
log_target_prefix =
long_listing = False
max_delete = -1
mime_type =
multipart_chunk_size_mb = 15
multipart_max_chunks = 10000
preserve_attrs = True
progress_meter = True
proxy_host =
proxy_port = 0
put_continue = False
recursive = False
recv_chunk = 65536
reduced_redundancy = False
requester_pays = False
restore_days = 1
secret_key = ${credentials.AWS_SECRET_ACCESS_KEY}
send_chunk = 65536
server_side_encryption = False
signature_v2 = False
simpledb_host = sdb.amazonaws.com
skip_existing = False
socket_timeout = 300
stats = False
stop_on_error = False
storage_class =
urlencoding_mode = normal
use_https = True
use_mime_magic = True
verbosity = WARNING
website_endpoint = http://%(bucket)s.s3-website-%(location)s.amazonaws.com/
website_error =
website_index = index.html
						`;
                    case "rclone":
                        return `
[minio]
type = s3
provider = Minio
env_auth = false
upload_concurrency = 5
acl = private
bucket_acl = private
endpoint = ${credentials.AWS_S3_ENDPOINT}
access_key_id = ${credentials.AWS_ACCESS_KEY_ID}
secret_access_key = ${credentials.AWS_SECRET_ACCESS_KEY}
session_token = ${credentials.AWS_SESSION_TOKEN}
						`;
                }
            })()
                .replace(/^\n/, "")
                .replace(/[\t\n]+$/, ""),
            programmingLanguage: ((): string => {
                switch (selectedTechnology) {
                    case "R (aws.S3)":
                    case "R (paws)":
                        return "r";
                    case "Python (s3fs)":
                    case "Python (boto3)":
                    case "Python (polars)":
                        return "python";
                    case "shell environment variables":
                    case "MC client":
                        return "bash";
                    case "s3cmd":
                    case "rclone":
                        //NOTE: Not supported by the react-code-block
                        return "init";
                }
            })()
        };
    }
);

const isRefreshing = createSelector(state, state => state.isRefreshing);

const main = createSelector(
    isReady,
    isRefreshing,
    credentials,
    selectedTechnology,
    initScript,
    createSelector(readyState, state => {
        if (state === null) {
            return null;
        }

        return state.expirationTime;
    }),
    (
        isReady,
        isRefreshing,
        credentials,
        selectedTechnology,
        initScript,
        expirationTime
    ) => {
        if (!isReady) {
            return {
                isReady: false as const,
                isRefreshing
            };
        }

        assert(credentials !== null);
        assert(selectedTechnology !== null);
        assert(initScript !== null);
        assert(expirationTime !== null);

        return {
            isReady: true as const,
            isRefreshing,
            credentials,
            selectedTechnology,
            initScript,
            expirationTime
        };
    }
);

export const selectors = { main };

const s3Config = createSelector(s3ConfigManagement.selectors.s3Configs, s3Configs =>
    s3Configs.find(
        s3Config =>
            s3Config.origin === "deploymentRegion" &&
            s3Config.paramsOfCreateS3Client.isStsEnabled
    )
);

export const privateSelectors = {
    s3Config,
    isRefreshing
};
