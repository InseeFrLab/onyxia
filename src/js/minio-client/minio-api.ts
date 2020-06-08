import fileReaderStream from 'filereader-stream';
import { Client, PostPolicy } from 'minio';

export default (client: Client) => ({
	statObject: ({ bucketName, fileName }) =>
		client.statObject(bucketName, fileName),
	isBucketExist: (bucketName) => client.bucketExists(bucketName),
	removeBucket: (bucketName) => client.removeBucket(bucketName),
	createBucket: (bucket) => client.makeBucket(bucket, undefined),
	listBuckets: () => client.listBuckets(),
	listObjects: (name, prefix = '', rec = true) =>
		client.listObjects(name, prefix, rec),
	putObject: ({ file, bucketName, notify, path }) =>
		new Promise((resolve, reject) => {
			const stream = fileReaderStream(file);
			stream
				.on('data', (chunk) => {
					if (notify) {
						notify('data', { size: chunk.length, stream });
					}
				})
				.on('end', () => {
					if (notify) {
						notify('end', { stream });
					}
				});
			let metadata = {};
			if (
				file.type &&
				(file.type.includes('video') || file.type.includes('pdf'))
			) {
				metadata = { 'Content-Type': file.type };
			}
			client.putObject(
				bucketName,
				`${path ? `${path}/` : ''}${file.name}`,
				stream,
				file.size,
				metadata,
				(err, etag) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(etag);
				}
			);
		}),
	removeObject: ({ bucketName, objectName }) =>
		new Promise((resolve, reject) => {
			client.removeObject(bucketName, objectName, (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(true);
			});
		}),
	getObject: ({ bucketName, objectName, size, notify }) =>
		new Promise((resolve, reject) => {
			client.getObject(bucketName, objectName, (err, stream) => {
				if (err) {
					reject(err);
					return;
				}
				const chunks = [];
				stream.on('data', (chunk) => {
					chunks.push(chunk);
					if (notify) {
						notify('data', { size: chunk.length, stream });
					}
				});
				stream.on('close', () => {
					if (notify) {
						notify('close', { stream });
					}
					resolve('close');
				});
				stream.on('end', () => {
					const file = new File(chunks, objectName);
					if (notify) {
						notify('end', { file, stream });
					}
					resolve(file);
				});
			});
		}),
	presignedGetObject: ({ bucketName, objectName, duration = 3600 }) =>
		new Promise((resolve, reject) => {
			client.presignedGetObject(
				bucketName,
				objectName,
				duration,
				(err, presignedUrl) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(presignedUrl);
				}
			);
		}),
	presignedPostBucket: (
		bucketName: string,
		keyPrefix: string,
		duration = 3600
	) =>
		new Promise((resolve, reject) => {
			const policy = new PostPolicy();
			policy.setBucket(bucketName);
			var expires = new Date();
			expires.setSeconds(duration);
			policy.setExpires(expires);
			policy.setKeyStartsWith(keyPrefix + '/');
			return resolve(client.presignedPostPolicy(policy));
		}),
	getBucketPolicy: (bucket) => client.getBucketPolicy(bucket),
	setBucketPolicy: ({ bucketName, policy }) =>
		new Promise((resolve, reject) => {
			client.setBucketPolicy(bucketName, JSON.stringify(policy), (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(true);
			});
		}),
});
