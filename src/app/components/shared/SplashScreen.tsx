
import { useState, useEffect, useReducer, memo } from "react";
import type { ReactNode } from "react";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames } from "app/theme/useClassNames";
import { css, cx, keyframes } from "tss-react";
import { useDomRect } from "powerhooks";
import Color from "color";
import { createUseGlobalState } from "powerhooks";
import { useConstCallback } from "powerhooks";

export type Props = {
    className?: string;
};

const fadeOutDuration = 700;

export const { useSplashScreen } = (() => {


    const { useDelay } = (() => {

        const { useLastDelayedTime } = createUseGlobalState(
            "lastDelayedTime",
            0,
            { "persistance": "localStorage" }
        );

        function useDelay() {

            const { lastDelayedTime, setLastDelayedTime } = useLastDelayedTime();

            return {
                "getDoUseDelay": useConstCallback(() => {

                    const doUseDelay = Date.now() - lastDelayedTime > 30000;

                    if (doUseDelay) {
                        setLastDelayedTime(Date.now());
                    }

                    return doUseDelay;

                })
            };

        }

        return { useDelay };


    })();

    const { useDisplayState } = createUseGlobalState(
        "displayState",
        { "count": 1, "isTransparencyEnabled": false, "prevTime": 0 },
        { "persistance": false }
    );

    function useHideSplashScreen(params: Pick<ReturnType<typeof useDisplayState>, "setDisplayState">) {

        //TODO: test nesting call to useDisplayState
        const { setDisplayState } = params;

        const { getDoUseDelay } = useDelay();

        const [trigger, pullTrigger] = useReducer((counter: number) => counter + 1, 0);

        useEffect(
            () => {

                if (trigger === 0) {
                    return;
                }

                let timer = setTimeout(() => { }, 0);

                (async () => {

                    if (getDoUseDelay()) {
                        await new Promise(resolve => timer = setTimeout(resolve, 1000));
                    }

                    setDisplayState(({ count, ...rest }) => ({
                        ...rest,
                        "count": Math.max(count - 1, 0),
                        "prevTime": Date.now()
                    }))

                })();

                return () => clearTimeout(timer);

            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [trigger]
        );

        const hideSplashScreen = useConstCallback(() => pullTrigger());

        return { hideSplashScreen };

    }

    function useOnSplashScreenHidden(
        params: {
            onHidden: (() => void) | undefined;
            isSplashScreenShown: boolean;
            prevTime: number;
        }
    ) {

        const { onHidden, isSplashScreenShown, prevTime } = params;

        useEffect(
            () => {

                if (isSplashScreenShown || onHidden === undefined) {
                    return;
                }

                const delayLeft = [fadeOutDuration - (Date.now() - prevTime)]
                    .filter(v => v > 0)[0] ?? 0;

                let timer: ReturnType<typeof setTimeout>;

                (async () => {

                    await new Promise(resolve => timer = setTimeout(
                        resolve, delayLeft
                    ));

                    onHidden();

                })();

                return () => clearTimeout(timer);

            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [isSplashScreenShown]
        );

    }

    function useSplashScreen(
        params?: { onHidden?(): void }
    ) {

        const { onHidden } = params ?? {};

        const { displayState, setDisplayState } = useDisplayState();

        const isSplashScreenShown = displayState.count > 0;

        useOnSplashScreenHidden({
            onHidden,
            isSplashScreenShown,
            "prevTime": displayState.prevTime
        });

        const { hideSplashScreen } = useHideSplashScreen({ setDisplayState });

        return {
            isSplashScreenShown,
            "isTransparencyEnabled": displayState.isTransparencyEnabled,
            "showSplashScreen":
                useConstCallback((params: { enableTransparency: boolean; }) => {
                    const { enableTransparency } = params;
                    setDisplayState(({ count }) => ({
                        "count": count + 1,
                        "isTransparencyEnabled": enableTransparency,
                        "prevTime": Date.now()
                    }));
                }),
            hideSplashScreen,
        };

    }

    return { useSplashScreen };

})();



const fadeInAndOut = keyframes`
60%, 100% {
    opacity: 0;
}
0% {
    opacity: 0;
}
40% {
    opacity: 1;
}
`;

const { useClassNames } = createUseClassNames<{
    isVisible: boolean;
    isFadingOut: boolean;
    isTransparencyEnabled: boolean;
}>()(
    (theme, { isVisible, isFadingOut, isTransparencyEnabled }) => ({
        "root": {
            "backgroundColor": (() => {

                const color = new Color(theme.custom.colors.useCases.surfaces.background).rgb();

                return color
                    .alpha(isTransparencyEnabled ? 0.6 : (color as any).valpha)
                    .string();

            })(),
            "backdropFilter": isTransparencyEnabled ? "blur(10px)" : undefined,
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "visibility": isVisible ? "visible" : "hidden",
            "opacity": isFadingOut ? 0 : 1,
            "transition": `opacity ease-in-out ${fadeOutDuration}ms`,
            "& g": {
                "opacity": 0,
                "animation": `${fadeInAndOut} 3.5s infinite ease-in-out`,
                "&:nth-child(1)": {
                    "animationDelay": ".4s"
                },
                "&:nth-child(2)": {
                    "animationDelay": ".8s"
                },
                "&:nth-child(3)": {
                    "animationDelay": "1.2s"
                }
            }
        },
        "svg": {
            "fill": theme.custom.colors.palette.exuberantOrange.main,
            "height": "20%"
        }

    })
);

const SplashScreen = memo((props: Props) => {

    const { className } = props;

    const { isSplashScreenShown, isTransparencyEnabled } = useSplashScreen();

    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const { classNames } = useClassNames({
        isVisible,
        isFadingOut,
        isTransparencyEnabled
    });

    useEffect(
        ()=>{

            let timer = setTimeout(() => { }, 0);

            (async ()=>{

                    if (isSplashScreenShown) {

                        setIsFadingOut(false);
                        setIsVisible(true);

                    } else {


                        setIsFadingOut(true);

                        await new Promise(resolve => timer = setTimeout(resolve, fadeOutDuration));

                        setIsFadingOut(false);
                        setIsVisible(false);

                    }

            })();

            return ()=> clearTimeout(timer);

        },
        [isSplashScreenShown]
    );

    return (
        <div className={cx(classNames.root, className)}>
            <OnyxiaLogoSvg
                className={classNames.svg}
            />
        </div>
    );

});

export function SplashScreenProvider(
    params: {
        children: ReactNode;
    }
) {
    const { children } = params;

    const { ref, domRect: { width, height } } = useDomRect();

    return (
        <div ref={ref} className={css({ "height": "100%" })}>
            <SplashScreen className={css({ width, "position": "absolute", height, "zIndex": 10 })} />
            {children}
        </div>
    );

}
