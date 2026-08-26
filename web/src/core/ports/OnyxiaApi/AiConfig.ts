import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import type { AiAccountCreation } from "core/ports/Ai";
import { type LocalizedString, zLocalizedString } from "./Language";
import type { OidcParams_Partial } from "./OidcParams";
import type { ApiTypes } from "core/adapters/onyxiaApi/ApiTypes";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";

type AiConfig_AI_EnvValue_ExpectedShape = ArrayOrNot<{
    id?: string;
    URL: string;
    name?: string;
    provider?: string;
    description?: LocalizedString;
    accountCreation?: {
        title?: LocalizedString;
        description?: LocalizedString;
        buttonLabel?: LocalizedString;
    };
    oauthProvider: string;
    oidcConfiguration?: Partial<ApiTypes.OidcConfiguration>;
}>;

const zAiConfig_AI_EnvValue_ExpectedShape = (() => {
    type TargetType = AiConfig_AI_EnvValue_ExpectedShape;

    const zOidcConfigurationShape = z.object({
        issuerURI: z.string().optional(),
        clientID: z.string().optional(),
        extraQueryParams: z.string().optional(),
        scope: z.string().optional(),
        idleSessionLifetimeInSeconds: z.union([z.number(), z.string()]).optional()
    });

    const zOidcConfiguration = z.custom<Partial<ApiTypes.OidcConfiguration>>(
        value => zOidcConfigurationShape.safeParse(value).success
    );

    const zAiConfig = z.object({
        id: z.string().optional(),
        URL: z.string(),
        name: z.string().optional(),
        provider: z.string().optional(),
        description: zLocalizedString.optional(),
        accountCreation: z
            .object({
                title: zLocalizedString.optional(),
                description: zLocalizedString.optional(),
                buttonLabel: zLocalizedString.optional()
            })
            .optional(),
        oauthProvider: z.string(),
        oidcConfiguration: zOidcConfiguration.optional()
    });

    const zTargetType = z.union([zAiConfig, z.array(zAiConfig)]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type AiConfig = {
    entries: AiConfig.Entry[];
};

export namespace AiConfig {
    export type Entry = {
        id: string;
        url: string;
        name: string | undefined;
        provider: string;
        description: LocalizedString | undefined;
        accountCreation: AiAccountCreation | undefined;
        oauthProvider: string;
        oidcParams: OidcParams_Partial;
    };
}

export function parseAiConfigFromEnvValue(params: { envValue: string }): AiConfig {
    const { envValue } = params;

    if (envValue === "") {
        return { entries: [] };
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON5.parse(envValue);
    } catch {
        throw new Error("The AI env is not a valid JSON5");
    }

    const parseResult = zAiConfig_AI_EnvValue_ExpectedShape.safeParse(parsedValue);

    if (!parseResult.success) {
        throw new Error(`The format of the AI env is not valid: ${parseResult.error}`);
    }

    const aiConfigs = Array.isArray(parseResult.data)
        ? parseResult.data
        : [parseResult.data];

    return {
        entries: aiConfigs.map(
            (aiConfig, index): AiConfig.Entry => ({
                id: aiConfig.id ?? `onyxia-${index}`,
                url: aiConfig.URL,
                name: aiConfig.name,
                provider: aiConfig.provider ?? "openai",
                description: aiConfig.description,
                accountCreation:
                    aiConfig.accountCreation === undefined
                        ? undefined
                        : {
                              title: aiConfig.accountCreation.title,
                              description: aiConfig.accountCreation.description,
                              buttonLabel: aiConfig.accountCreation.buttonLabel
                          },
                oauthProvider: aiConfig.oauthProvider,
                oidcParams: {
                    issuerUri: aiConfig.oidcConfiguration?.issuerURI || undefined,
                    clientId: aiConfig.oidcConfiguration?.clientID || undefined,
                    extraQueryParams_raw:
                        aiConfig.oidcConfiguration?.extraQueryParams || undefined,
                    scope_spaceSeparated: aiConfig.oidcConfiguration?.scope || undefined,
                    idleSessionLifetimeInSeconds: (() => {
                        const value =
                            aiConfig.oidcConfiguration?.idleSessionLifetimeInSeconds;

                        if (value === "" || value === undefined) {
                            return undefined;
                        }

                        if (typeof value === "number") {
                            return value;
                        }

                        return parseInt(value);
                    })()
                }
            })
        )
    };
}
