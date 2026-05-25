# S3 Configuration

Configuration parameters for integrating your Onyxia service with S3.

[The installation guide](/admin-doc/readme/data-s3.md) provides instructions on how to set up [Minio](https://min.io/) with a basic configuration. However, you may want more control or need to connect to a different S3-compatible system.

Below are all the available configuration options.

{% code title="apps/onyxia/values.yaml" %}

```yaml
onyxia:
  api:
    regions: [
      {
        # ...
        data: {
          S3 : { ... } # ...See expected format below
        }
      }
    ]
```

{% endcode %}

````typescript
type S3 = {
  /**
   * The URL of the S3 server.
   * Examples: "https://minio.lab.sspcloud.fr" or "https://s3.amazonaws.com".
   */
  URL: string;

  /**
   * The AWS S3 region. This parameter is optional if you are configuring
   * integration with a MinIO server.
   * Example: "us-east-1"
   */
  region?: string;

  /**
   * This parameter informs Onyxia how to format file download URLs for the configured 
   * S3 server.
   * Default: true
   *
   * Example:
   * Assume "https://minio.lab.sspcloud.fr" as the value for region.data.S3.URL.
   * For a file "a/b/c/foo.parquet" in the bucket "user-bob":
   *
   * With pathStyleAccess set to true, the download link will be:
   *   https://minio.lab.sspcloud.fr/user-bob/a/b/c/foo.parquet
   *
   * With pathStyleAccess set to false (virtual-hosted style), the link will be:
   *   https://user-bob.minio.lab.sspcloud.fr/a/b/c/foo.parquet
   *
   * For MinIO, pathStyleAccess is typically set to true.
   * For Amazon Web Services S3, is has to be set to false.
   */
  pathStyleAccess?: boolean;

  /**
   * Defines where users are permitted to read/write S3 files,
   * specifying the allocated storage space in terms of bucket and object name prefixes.
   *
   * Mandatory unless data.S3.sts is not defined then it's optional.
   *
   * Example:
   * For a user "bob" in the "exploration" group, using the configuration:
   *
   * Shared bucket mode, all the users share a single bucket:
   *   "workingDirectory": {
   *       "bucketMode": "shared",
   *       "bucketName": "onyxia",
   *       "prefix": "user-",
   *       "prefixGroup": "project-"
   *   }
   *
   * In this configuration Onyxia will assumes that Bob has read/write access to 
   * objects starting with "user-bob/" and "project-exploration/" in the "onyxia" 
   * bucket.
   *
   * Multi bucket mode:
   *   "workingDirectory": {
   *       "bucketMode": "multi",
   *       "bucketNamePrefix": "user-",
   *       "bucketNamePrefixGroup": "project-",
   *   }
   *
   * In this configuration Onyxia will assumes that Bob has read/wite access to the 
   * entire "user-bob" and "project-exploration" buckets.
   *
   * If STS is enabled and a bucket doesn't exist, Onyxia will try to create it.
   */
  workingDirectory?:
    | {
        bucketMode: "shared";
        bucketName: string;
        prefix: string;
        prefixGroup: string;
      }
    | {
        bucketMode: "multi";
        bucketNamePrefix: string;
        bucketNamePrefixGroup: string;
      };
  /**
   * Defines a list of S3 directory bookmarks to display in the user's file explorer 
   * interface.
   * 
   * Bookmarks can be:
   * - Static: shown to all users.
   * - Dynamic: shown only if specific conditions based on the user's identity token 
   *   are met.
   *
   * Each bookmark must define:
   * - `fullPath`: The absolute S3 path to the bookmarked folder.
   * - `title`: The display title, supporting dynamic content via template variables.
   * - `description` (optional): A short description of the bookmark.
   * - `tags` (optional): An array of LocalizedString tags for UI categorization.
   *
   * For static bookmarks:
   * - Do not specify any `claimName`.
   * - The bookmark is shown to all users.
   *
   * For dynamic bookmarks:
   * - Set `claimName` to the name of a claim (e.g., `"groups"`) from the user's 
   *   **ID token**.
   * - The ID token is the one issued by the **OIDC configuration associated 
   *   with the S3 client** (i.e., from `sts.oidcConfiguration`).
   * - `includedClaimPattern` is a regular expression that must match at least one 
   *    value in the specified claim for the bookmark to be shown.
   * - `excludedClaimPattern` is a regular expression that, if matched by any value 
   *    in the claim, causes the bookmark to be ignored.
   * - If a `claimValue` matches both, exclusion takes precedence 
   *   (i.e., the bookmark is not shown).
   *
   * Template placeholders:
   * - `$1`, `$2`, ...: inserts corresponding capture groups from 
   *   `includedClaimPattern` (useful for custom rendering in `fullPath`, `title`, 
   *   `description`, or `tags`).
   *
   * 🔁 Example (static):
   * ```json
   * {
   *   "bookmarkedDirectories": [
   *     {
   *       "fullPath": "data/public",
   *       "title": {
   *         "fr": "Données publiques",
   *         "en": "Public Data"
   *       },
   *       "description": {
   *         "fr": "Dossier partagé contenant des jeux de données publics.",
   *         "en": "Shared folder containing public datasets."
   *       },
   *       "tags": [
   *         {
   *           "fr": "lecture seule",
   *           "en": "read-only"
   *         }
   *       ]
   *     }
   *   ]
   * }
   * ```
   *
   * 🔁 Example (dynamic):
   * ```json
   * {
   *   "bookmarkedDirectories": [
   *     {
   *       "fullPath": "group-$1/",
   *       "claimName": "groups",
   *       "includedClaimPattern": "^group-(.*)$",
   *       "excludedClaimPattern": "^group-secret$",
   *       "title": "Group: $1",
   *       "description": "Files accessible to group $1",
   *       "tags": ["group", "$1"]
   *     }
   *   ]
   * }
   * ```
   */
  bookmarkedDirectories?: ({
    fullPath: string;
    title: LocalizedString;
    description?: LocalizedString;
    tags?: LocalizedString[];
  } & (
    | {}
    | {
        claimName: string;
        includedClaimPattern: string;
        excludedClaimPattern: string;
      }
  ))[];
  
  /**
   * Configuration for Onyxia to dynamically request S3 tokens on behalf of users.
   * Enabling S3 allows users to avoid manual configuration of a service account via the Onyxia interface.
   */
  sts?: {
    /**
     * The STS endpoint URL of your S3 server.
     * For integration with MinIO, this property is optional as it defaults to region.data.S3.URL.
     * For Amazon Web Services S3, set this to "https://sts.amazonaws.com".
     */
    URL?: string;

    /**
     * The duration for which temporary credentials are valid.
     * AWS: Maximum of 43200 seconds (12 hours).
     * MinIO: Maximum of 604800 seconds (7 days).
     * Without this parameter, Onyxia requests 7-day validity, subject to the S3 server's policy limits.
     */
    durationSeconds?: number;

    /**
     * Optional parameter to specify RoleARN and RoleSessionName for the STS request.
     *
     * Example:
     *   "role": {
     *     "roleARN": "arn:aws:iam::123456789012:role/onyxia",
     *     "roleSessionName": "onyxia"
     *   }
     */
    role?: {
      roleARN: string;
      roleSessionName: string;
    };

    /**
     * See: https://docs.onyxia.sh/admin-doc/openid-connect-configuration#oidc-configuration-for-services-onyxia-connects-to
     */
    oidcConfiguration?: OidcConfiguration;
  };
};
````


---

# Agent Instructions: Querying This Documentation

If you need additional information that is not directly available in this page, you can query the documentation dynamically by asking a question.

Perform an HTTP GET request on the current page URL with the `ask` query parameter:

```
GET https://docs.onyxia.sh/admin-doc/s3-configuration.md?ask=<question>
```

The question should be specific, self-contained, and written in natural language.
The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
