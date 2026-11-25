import { useResolveThemedAssetUrl } from "onyxia-ui";
import { useTranslation } from "ui/i18n";
import type { ConnectedProvider } from "core/usecases/gitProvidersManagement";
import type { DisconnectedProviderView } from "core/usecases/gitRepositoryFieldUiController";
import { defaultGitProviderLogoUrlByType } from "ui/pages/account/AccountGitTab/defaultGitProviderLogoUrlByType";
import type { ProviderChip } from "./ProviderLabels";

export function useGetProviderLogoUrl() {
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();

    return (provider: ConnectedProvider | DisconnectedProviderView) =>
        provider.logoUrl !== undefined
            ? resolveThemedAssetUrl(provider.logoUrl)
            : defaultGitProviderLogoUrlByType[provider.type];
}

export function useGetProviderChip() {
    const { t: t_card } = useTranslation("GitProviderCard");

    return (provider: ConnectedProvider | DisconnectedProviderView): ProviderChip => {
        if (!("issue" in provider)) {
            return { label: t_card("chip connected"), severity: "success" };
        }

        switch (provider.state) {
            case "to connect":
                return {
                    label: t_card(
                        provider.connectionMethod === "oauth"
                            ? "chip sign in required"
                            : "chip connection required"
                    ),
                    severity: "neutral"
                };
            case "session expired":
                return { label: t_card("chip reconnect required"), severity: "warning" };
            case "failed":
                return { label: t_card("chip connection error"), severity: "error" };
        }
    };
}
