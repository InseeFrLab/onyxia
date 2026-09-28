import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
// NOTE: Logos from LobeHub Icons (MIT): https://github.com/lobehub/lobe-icons
import anthropicDarkLogoUrl from "core/assets/img/ai-providers/anthropic-dark.svg";
import anthropicLightLogoUrl from "core/assets/img/ai-providers/anthropic-light.svg";
import deepseekLogoUrl from "core/assets/img/ai-providers/deepseek.svg";
import mistralLogoUrl from "core/assets/img/ai-providers/mistral.svg";
import openaiDarkLogoUrl from "core/assets/img/ai-providers/openai-dark.svg";
import openaiLightLogoUrl from "core/assets/img/ai-providers/openai-light.svg";

const openaiLogoUrl: AiConfig.LogoUrl = {
    light: openaiLightLogoUrl,
    dark: openaiDarkLogoUrl
};

/** The logo of a provider that the admin didn't give one, known by its type */
export const providerTypeLogoUrl: Record<
    AiConfig.SupportedAiProviderType,
    AiConfig.LogoUrl
> = {
    deepseek: deepseekLogoUrl,
    openai: openaiLogoUrl,
    "openai-compatible": openaiLogoUrl,
    mistral: mistralLogoUrl,
    anthropic: {
        light: anthropicLightLogoUrl,
        dark: anthropicDarkLogoUrl
    }
};
