import { useResolveThemedAssetUrl } from "onyxia-ui";
import { useTranslation } from "ui/i18n";
import type { ConnectedForge } from "core/usecases/gitForgesManagement";
import type { DisconnectedForgeView } from "core/usecases/gitRepositoryFieldUiController";
import { defaultGitForgeLogoUrlByType } from "ui/pages/account/AccountGitTab/defaultGitForgeLogoUrlByType";
import type { ForgeChip } from "./ForgeLabels";

export function useGetForgeLogoUrl() {
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();

    return (forge: ConnectedForge | DisconnectedForgeView) =>
        forge.logoUrl !== undefined
            ? resolveThemedAssetUrl(forge.logoUrl)
            : defaultGitForgeLogoUrlByType[forge.type];
}

export function useGetForgeChip() {
    const { t: t_card } = useTranslation("GitForgeCard");

    return (forge: ConnectedForge | DisconnectedForgeView): ForgeChip => {
        if (!("issue" in forge)) {
            return { label: t_card("chip connected"), severity: "success" };
        }

        switch (forge.state) {
            case "to connect":
                return {
                    label: t_card(
                        forge.connectionMethod === "oauth"
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
