import axios from "axios";
import type { Param0, ReturnType } from "tsafe";
import { createKeycloakOidcClient } from "./keycloakOidcClient";
import { S3Client } from "../ports/S3Client";
import { getNewlyRequestedOrCachedTokenFactory } from "lib/tools/getNewlyRequestedOrCachedToken";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { Deferred } from "evt/tools/Deferred";

export async function createMinioS3Client(params: {
    url: string;
    keycloakParams: Param0<typeof createKeycloakOidcClient>;
}): Promise<S3Client> {
    const { url, keycloakParams } = params;

    const oidcClient = await createKeycloakOidcClient(keycloakParams);

    if (!oidcClient.isUserLoggedIn) {
        return oidcClient.login();
    }

    const { getAccessToken } = oidcClient;

    const { getNewlyRequestedOrCachedToken } = getNewlyRequestedOrCachedTokenFactory({
        "requestNewToken": async () => {
            const now = Date.now();
            const tokenTTL = 7 * 24 * 3600 * 1000;

            const { data } = await axios.create({ "baseURL": url }).post<string>(
                "/?" +
                    Object.entries({
                        "Action": "AssumeRoleWithClientGrants",
                        "Token": await getAccessToken(),
                        "DurationSeconds": tokenTTL / 1000,
                        "Version": "2011-06-15",
                    })
                        .map(([key, value]) => `${key}=${value}`)
                        .join("&"),
            );

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const root = xmlDoc.getElementsByTagName(
                "AssumeRoleWithClientGrantsResponse",
            )[0];

            const credentials = root.getElementsByTagName("Credentials")[0];
            const accessKeyId =
                credentials.getElementsByTagName("AccessKeyId")[0].childNodes[0]
                    .nodeValue;
            const secretAccessKey =
                credentials.getElementsByTagName("SecretAccessKey")[0].childNodes[0]
                    .nodeValue;
            const sessionToken =
                credentials.getElementsByTagName("SessionToken")[0].childNodes[0]
                    .nodeValue;

            assert(
                accessKeyId !== null && secretAccessKey !== null && sessionToken !== null,
            );

            return id<ReturnType<S3Client["getToken"]>>({
                accessKeyId,
                "expirationTime": now + tokenTTL,
                secretAccessKey,
                sessionToken,
            });
        },
        "returnCachedTokenIfStillValidForXPercentOfItsTTL": "90%",
    });

    const secretsManagerClient: S3Client = {
        "getToken": getNewlyRequestedOrCachedToken,
    };

    dS3Client.resolve(secretsManagerClient);

    return secretsManagerClient;
}

const dS3Client = new Deferred<S3Client>();

/** @deprecated */
export const { pr: prS3Client } = dS3Client;
