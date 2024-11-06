/**
 * "/bucket-name/object/name" => { bucketName: "bucket-name", objectName: "object/name" }
 * "bucket-name/object/name" => { bucketName: "bucket-name", objectName: "object/name" }
 * "bucket-name/object/name/" => { bucketName: "bucket-name", objectName: "object/name/" }
 * "bucket-name/" => { bucketName: "bucket-name", objectName: "" }
 * "bucket-name" => { bucketName: "bucket-name", objectName: "" }
 * "s3://bucket-name/object/name" => { bucketName: "bucket-name", objectName: "object/name" }
 */
export function bucketNameAndObjectNameFromS3Path(path: string) {
    const [bucketName, ...rest] = path.replace(/^(s3:)?\/+/, "").split("/");

    return {
        bucketName,
        objectName: rest.join("/")
    };
}
