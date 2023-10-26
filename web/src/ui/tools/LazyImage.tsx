import "minimal-polyfills/Object.fromEntries";
import { LazySvg, type LazySvgProps } from "ui/tools/LazySvg";

type Props = {
    className?: string;
    url: string;
    svgProps: Omit<LazySvgProps, "svgUrl">;
    imgProps: {
        className?: string;
        alt: string;
    };
    cx: (
        className1: string | undefined,
        className2: string | undefined
    ) => string | undefined;
};

export function LazyImage(props: Props) {
    const { className, url, imgProps, svgProps, cx } = props;

    return url.endsWith(".svg") ? (
        <LazySvg
            svgUrl={url}
            {...svgProps}
            className={cx(className, svgProps.className)}
        />
    ) : (
        <img
            src={url}
            {...imgProps}
            alt={imgProps.alt}
            className={cx(className, imgProps.className)}
        />
    );
}
