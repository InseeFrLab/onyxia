import Mustache from "mustache";
import type { State } from "core/setup";
import { getValidatedEnv } from "js/validatedEnv";
import type { UserConfigs } from "core/usecases/userConfigs";

type OidcTokens = Readonly<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
}>;

// Disable mustache html escaping
(Mustache as any).escape = (text: any) => text;

export const getFieldSafeAttr = (field: Record<string, Field>) => {
    const media = (field.media && field.media.type && field.media.type) || "";
    return !field["x-form"]
        ? { ...field, hidden: false, media }
        : { ...field, ...field["x-form"], media };
};

export type BuildOnyxiaValue = {
    s3: NonNullable<State["user"]["s3"]>;
    publicIp: string;
    parsedJwt: Record<"username" | "email" | "familyName" | "firstName", string>;
    secretExplorerUserHomePath: string;
    userConfigs: UserConfigs;
    vaultClientConfig: {
        baseUri: string;
        engine: string;
    };
    oidcTokens: OidcTokens;
    vaultToken: string;
};

const buildMustacheView = (params: BuildOnyxiaValue) => {
    const env = getValidatedEnv();

    const {
        s3,
        publicIp,
        parsedJwt,
        userConfigs,
        secretExplorerUserHomePath,
        vaultClientConfig,
        oidcTokens,
        vaultToken
    } = params;

    return {
        "user": {
            "idep": parsedJwt.username,
            "name": `${parsedJwt.familyName} ${parsedJwt.firstName}`,
            "email": parsedJwt.email,
            "password": "",
            "key": "https://example.com/placeholder.gpg",
            "ip": publicIp
        },
        "git": {
            "name": userConfigs.gitName,
            "email": userConfigs.gitEmail,
            "credentials_cache_duration": userConfigs.gitCredentialCacheDuration
        },
        "status": "",
        "keycloak": {
            "KC_ID_TOKEN": oidcTokens.idToken,
            "KC_REFRESH_TOKEN": oidcTokens.refreshToken,
            "KC_ACCESS_TOKEN": oidcTokens.accessToken
        },
        "kubernetes": env.KUBERNETES !== undefined ? { ...env.KUBERNETES } : undefined,
        "vault": {
            "VAULT_ADDR": vaultClientConfig.baseUri,
            "VAULT_TOKEN": vaultToken,
            "VAULT_MOUNT": vaultClientConfig.engine,
            "VAULT_TOP_DIR": secretExplorerUserHomePath
        },
        "kaggleApiToken": userConfigs.kaggleApiToken,
        "s3": {
            ...s3,
            "AWS_BUCKET_NAME": parsedJwt.username
        }
    };
};

//TODO: Rename
export const mustacheRender = (
    field: { "x-form"?: { value: string } },
    buildOnyxiaValue: BuildOnyxiaValue
) => {
    const { value: template = "" } = field?.["x-form"] ?? {};

    return Mustache.render(template, buildMustacheView(buildOnyxiaValue));
};

export type Field = {
    value: string;
    hidden: boolean;
    type: string;
};

export const filterOnglets = <
    T extends {
        description: string;
        nom: string;
        fields: { field: Record<string, Pick<Field, "hidden">> }[];
    }[]
>(
    onglets: T
): T =>
    onglets.filter(
        ({ fields }) =>
            fields.filter(({ field }) => !field["x-form"] || !field["x-form"].hidden)
                .length > 0
    ) as any;
