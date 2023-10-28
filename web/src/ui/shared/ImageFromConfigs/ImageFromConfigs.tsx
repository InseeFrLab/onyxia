import "minimal-polyfills/Object.fromEntries";
import { useMemo } from "react";
import { LazySvg } from "ui/tools/LazySvg";
import { tss } from "ui/theme";
import { useResolveLocalizedString } from "ui/i18n";
import type { AssetVariantUrl } from "./AssetVariantUrl";

type Props = {
    className?: string;
    url: AssetVariantUrl;
    alt?: string;
};

export function ImageFromConfigs(props: Props) {
    const { className, alt = "" } = props;

    const { cx, classes } = useStyles();

    const url = useResolveAssetVariantUrl(props.url);

    return url.endsWith(".svg") ? (
        <LazySvg svgUrl={url} className={cx(classes.svg, className)} />
    ) : (
        <img src={url} alt={alt} className={className} />
    );
}

const useStyles = tss.withName("svgStyles").create(({ theme }) => ({
    "svg": {
        [["&.", "& ."].map(prefix => `${prefix}focus-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.typography.textFocus
        },
        [["&.", "& ."].map(prefix => `${prefix}text-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.typography.textPrimary
        },
        [["&.", "& ."].map(prefix => `${prefix}surface-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.surfaces.surface1
        },
        [["&.", "& ."].map(prefix => `${prefix}background-color-fill`).join(", ")]: {
            "fill": theme.colors.useCases.surfaces.background
        }
    }
}));

function useResolveAssetVariantUrl(assetVariantUrl: AssetVariantUrl) {
    const { resolveLocalizedString } = useResolveLocalizedString();

    const {
        theme: { isDarkModeEnabled }
    } = useStyles();

    const url = useMemo(() => {
        if (typeof assetVariantUrl === "string") {
            return assetVariantUrl;
        }

        return resolveLocalizedString(
            "light" in assetVariantUrl
                ? isDarkModeEnabled
                    ? assetVariantUrl.dark
                    : assetVariantUrl.light
                : assetVariantUrl
        );
    }, [isDarkModeEnabled, assetVariantUrl, resolveLocalizedString]);

    return url;
}
