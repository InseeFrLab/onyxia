import { getBucketPolicy } from "./minio-tools";

/*
 * Diverses fonctions de travail sur les polices de sécurité S3.
 */

export const S3Actions = {
  GetObject: "s3:GetObject",
  GetBucketLocation: "s3:GetBucketLocation",
  ListBucket: "s3:ListBucket"
};

export const S3Principal = {
  any: "*"
};

export const S3Version = "2012-10-17";

export const S3Effect = {
  Allow: "Allow"
};

export const S3Resource = {
  prefix: "arn:aws:s3:::"
};

const toArray = e => (e ? (Array.isArray(e) ? e : [e]) : []);

const aIsInB = (a, b, strict = true) =>
  a
    ? toArray(b).indexOf(a) !== -1 && (!strict || toArray(b).length === 1)
    : false;

const createGetObjectPolicy = ({ Effect, Action, Principal }) => resources => ({
  Effect,
  Action: toArray(Action),
  Principal: { AWS: toArray(Principal) },
  Resource: toArray(resources)
});

const isStatementPoliciy = ({ Effect, Action, Principal }) => ({
  Effect: pEffect,
  Action: pAction,
  Principal: pPrincipal
}) =>
  Effect === pEffect &&
  aIsInB(Action, pAction) &&
  aIsInB(Principal, pPrincipal ? pPrincipal.AWS : []);

export const publicGetObjectPolicy = createGetObjectPolicy({
  Effect: S3Effect.Allow,
  Principal: S3Principal.any,
  Action: S3Actions.GetObject
});

export const statementPublicBucket = bucketName => ({
  Effect: S3Effect.Allow,
  Principal: { AWS: S3Principal.any },
  Action: [
    S3Actions.GetBucketLocation,
    S3Actions.GetObject,
    S3Actions.ListBucket
  ],
  Resource: `${S3Resource}${bucketName}/*`
});

export const publicListBucketPolicy = ({ resource, files }) => {
  const policy = createGetObjectPolicy({
    Effect: S3Effect.Allow,
    Principal: S3Principal.any,
    Action: S3Actions.ListBucket
  })(resource);
  policy.Condition = { StringEquals: { "s3:prefix": files } };
  return policy;
};

export const isPublicGetObjectPolicy = isStatementPoliciy({
  Effect: S3Effect.Allow,
  Action: S3Actions.GetObject,
  Principal: S3Principal.any
});

export const converToS3path = path => `${S3Resource.prefix}${path}`;

export const createPolicyWithDirectory = bucketName => async minioPath => {
  const policiesString = await getBucketPolicy(bucketName);
  const policies = JSON.parse(policiesString);
  const [policy] = policies.Statement;
  if (policy) {
    return {
      ...policies,
      Statement: [{ ...policy, Resource: [...policy.Resource, minioPath] }]
    };
  }
  return {
    Version: S3Version,
    Statement: [{ ...publicGetObjectPolicy(minioPath) }]
  };
};

export const createPolicyWithoutDirectory = bucketName => async minioPath => {
  const policiesString = await getBucketPolicy(bucketName);
  const policies = JSON.parse(policiesString);
  const [policy] = policies.Statement;
  if (policy) {
    const Resource = policy.Resource
      ? policy.Resource.filter(path => path !== minioPath)
      : [];
    return Resource.length > 0
      ? { ...policies, Statement: [{ ...policy, Resource }] }
      : { ...policies, Statement: [] };
  }
  return policies;
};
