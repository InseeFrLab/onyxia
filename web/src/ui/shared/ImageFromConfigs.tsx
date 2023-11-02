import { ThemedSvg } from "onyxia-ui/ThemedSvg";
import type { AssetVariantUrl } from "./AssetVariantUrl";
import { useResolveAssetVariantUrl } from "./AssetVariantUrl";

type Props = {
    className?: string;
    url: AssetVariantUrl;
    alt?: string;
};

export function ImageFromConfigs(props: Props) {
    const { className, alt = "" } = props;

    const url = useResolveAssetVariantUrl(props.url);

    return url.endsWith(".svg") ? (
        <ThemedSvg svgUrl={url} className={className} />
    ) : (
        <img src={url} alt={alt} className={className} />
    );
}
