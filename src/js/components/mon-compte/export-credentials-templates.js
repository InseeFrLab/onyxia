const exportTypes = [
	{
		id: 'r',
		label: 'R (aws.S3)',
		fileName: 'credentials.R',
		text: (c) =>
			`
install.packages("aws.s3", repos = "https://cloud.R-project.org")

Sys.setenv("AWS_ACCESS_KEY_ID" = "${c.AWS_ACCESS_KEY_ID}",
           "AWS_SECRET_ACCESS_KEY" = "${c.AWS_SECRET_ACCESS_KEY}",
           "AWS_DEFAULT_REGION" = "${c.AWS_DEFAULT_REGION}",
           "AWS_SESSION_TOKEN" = "${c.AWS_SESSION_TOKEN}",
           "AWS_S3_ENDPOINT"= "${c.AWS_S3_ENDPOINT}")

library("aws.s3")
bucketlist()`,
	},
	{
		id: 'python',
		label: 'Python (s3fs)',
		fileName: 'credentials.py',
		text: (c) =>
			`
import s3fs
fs = s3fs.S3FileSystem(client_kwargs={'endpoint_url': 'http://'+'${c.AWS_S3_ENDPOINT}'},key ='${c.AWS_ACCESS_KEY_ID}', secret = '${c.AWS_SECRET_ACCESS_KEY}', token = '${c.AWS_SESSION_TOKEN}')`,
	},
	{
		id: 'env',
		label: 'Environment variables',
		fileName: '.bashrc',
		text: (c) => `
export AWS_ACCESS_KEY_ID = ${c.AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY = ${c.AWS_SECRET_ACCESS_KEY}
export AWS_DEFAULT_REGION = ${c.AWS_DEFAULT_REGION}
export AWS_SESSION_TOKEN = ${c.AWS_SESSION_TOKEN}
export AWS_S3_ENDPOINT = ${c.AWS_S3_ENDPOINT}
		`,
	},
	{
		id: 's3cmd',
		label: 's3cmd (.s3cfg)',
		fileName: '.s3cfg',
		text: (c) =>
			`
[default]
access_key = ${c.AWS_ACCESS_KEY_ID}
access_token = ${c.AWS_SESSION_TOKEN}
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
host_base = ${c.AWS_S3_ENDPOINT}
host_bucket = ${c.AWS_S3_ENDPOINT}
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
secret_key = ${c.AWS_SECRET_ACCESS_KEY}
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
`,
	},
  	{
		id: 'rclone',
		label: 'rclone (.conf)',
		fileName: 'rclone.conf',
		text: (c) =>
			`
[minio]
type = s3
provider = Minio
env_auth = false
upload_concurrency = 5
acl = private
bucket_acl = private
endpoint = ${c.AWS_S3_ENDPOINT}
access_key_id = ${c.AWS_ACCESS_KEY_ID}
secret_access_key = ${c.AWS_SECRET_ACCESS_KEY}
session_token = ${c.AWS_SESSION_TOKEN}
`,
	},
];

export default exportTypes;
