import type { ArrayOrNot } from "core/tools/ArrayOrNot";
import type { AiGateway } from "core/ports/AiGateway";
import { type LocalizedString, zLocalizedString } from "./Language";
import type { OidcParams } from "./OidcParams";
import type { ApiTypes } from "core/adapters/onyxiaApi/ApiTypes";
import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import JSON5 from "json5";

type AI_EnvValue_ExpectedShape = ArrayOrNot<{
    URL: string;
    name?: string;
    description?: LocalizedString;
    accountCreation?: {
        title?: LocalizedString;
        description?: LocalizedString;
        buttonLabel?: LocalizedString;
    };
    oidcConfiguration: Omit<ApiTypes.OidcConfiguration, "issuerURI">;
}>;

const zAI_EnvValue_ExpectedShape = (() => {
    type TargetType = AI_EnvValue_ExpectedShape;

    const zOidcConfigurationShape = z.object({
        clientID: z.string().min(1),
        extraQueryParams: z.string().optional(),
        scope: z.string().optional(),
        idleSessionLifetimeInSeconds: z.union([z.number(), z.string()]).optional()
    });

    const zGatewayConfig = z.object({
        URL: z.string().url(),
        name: z.string().optional(),
        description: zLocalizedString.optional(),
        accountCreation: z
            .object({
                title: zLocalizedString.optional(),
                description: zLocalizedString.optional(),
                buttonLabel: zLocalizedString.optional()
            })
            .optional(),
        oidcConfiguration: zOidcConfigurationShape
    });

    const zTargetType = z.union([zGatewayConfig, z.array(zGatewayConfig)]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export type ManagedAiGatewayConfig = {
    entries: ManagedAiGatewayConfig.Entry[];
};

export namespace ManagedAiGatewayConfig {
    export type Entry = {
        url: string;
        name: string | undefined;
        description: LocalizedString | undefined;
        accountCreation: AiGateway.AccountCreation | undefined;
        oidcParams: Omit<OidcParams, "issuerUri">;
    };
}

export function parseManagedAiGatewayConfigFromEnvValue(params: {
    envValue: string;
}): ManagedAiGatewayConfig {
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

    const parseResult = zAI_EnvValue_ExpectedShape.safeParse(parsedValue);

    if (!parseResult.success) {
        throw new Error(`The format of the AI env is not valid: ${parseResult.error}`);
    }

    const gatewayConfigs = Array.isArray(parseResult.data)
        ? parseResult.data
        : [parseResult.data];

    return {
        entries: gatewayConfigs.map(gatewayConfig => {
            const url = new URL(gatewayConfig.URL).toString().replace(/\/$/, "");

            return {
                url,
                name: gatewayConfig.name,
                description: gatewayConfig.description,
                accountCreation:
                    gatewayConfig.accountCreation === undefined
                        ? undefined
                        : {
                              title: gatewayConfig.accountCreation.title,
                              description: gatewayConfig.accountCreation.description,
                              buttonLabel: gatewayConfig.accountCreation.buttonLabel
                          },
                oidcParams: {
                    clientId: gatewayConfig.oidcConfiguration.clientID,
                    extraQueryParams_raw:
                        gatewayConfig.oidcConfiguration.extraQueryParams || undefined,
                    scope_spaceSeparated:
                        gatewayConfig.oidcConfiguration.scope || undefined,
                    idleSessionLifetimeInSeconds: (() => {
                        const value =
                            gatewayConfig.oidcConfiguration.idleSessionLifetimeInSeconds;

                        if (value === "" || value === undefined) {
                            return undefined;
                        }

                        if (typeof value === "number") {
                            return value;
                        }

                        return parseInt(value);
                    })()
                }
            } satisfies ManagedAiGatewayConfig.Entry;
        })
    };
}
