
import { ZoomProvider as PowerhooksZoomProvider } from "powerhooks";
import type { ReactNode } from "react";
import { useEffectOnValueChange } from "powerhooks";
import { useWindowInnerSize } from "powerhooks";

export type Props = {
    children: ReactNode;
    /** e.g: 1920. Set to undefined to disable */
    zoomProviderReferenceWidth?: number;
};

/**
 * Design like if everyone has the same screen size.
 * Using this provider you don't have to implement responsive design.
 */
export function ZoomProvider(props: Props) {

    const { children, zoomProviderReferenceWidth } = props;

    const { windowInnerHeight, windowInnerWidth } = useWindowInnerSize();

    const isLandscape = windowInnerWidth > windowInnerHeight;

    useEffectOnValueChange(
        () => {

            if (zoomProviderReferenceWidth === undefined) {
                return;
            }

            window.location.reload();
        },
        [isLandscape]
    );

    return zoomProviderReferenceWidth !== undefined && !isLandscape ?
        <p>
            This app isn't compatible with landscape mode yet,
            please enable the rotation sensor and flip your phone.
        </p>
        :
        <PowerhooksZoomProvider referenceWidth={zoomProviderReferenceWidth}>
            {children}
        </PowerhooksZoomProvider>;

}