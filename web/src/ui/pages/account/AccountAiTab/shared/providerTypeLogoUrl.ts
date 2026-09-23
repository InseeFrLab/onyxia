import type { ThemedAssetUrl } from "onyxia-ui";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
// NOTE: Logos from LobeHub Icons (MIT): https://github.com/lobehub/lobe-icons
import anthropicDarkLogoUrl from "ui/assets/img/ai-providers/anthropic-dark.svg";
import anthropicLightLogoUrl from "ui/assets/img/ai-providers/anthropic-light.svg";
import deepseekLogoUrl from "ui/assets/img/ai-providers/deepseek.svg";
import mistralLogoUrl from "ui/assets/img/ai-providers/mistral.svg";
import openaiDarkLogoUrl from "ui/assets/img/ai-providers/openai-dark.svg";
import openaiLightLogoUrl from "ui/assets/img/ai-providers/openai-light.svg";

const openaiLogoUrl: ThemedAssetUrl = {
    light: openaiLightLogoUrl,
    dark: openaiDarkLogoUrl
};

export const providerTypeLogoUrl: Record<
    AiConfig.SupportedAiProviderType,
    ThemedAssetUrl
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
