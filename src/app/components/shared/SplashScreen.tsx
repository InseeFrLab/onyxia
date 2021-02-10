
import { useState, useEffect, memo } from "react";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx, keyframes } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import Color from "color";
import { createUseGlobalState } from "app/tools/hooks/useGlobalState";
import { useConstCallback } from "app/tools/hooks/useConstCallback";

export type Props = {
    className?: string;
};

export const { useSplashScreen } = (() => {

    const { useDisplayState } = createUseGlobalState(
        "displayState",
        { "count": 1, "isTransparencyEnabled": false },
        { "doDisableLocalStorage": true }
    );

    function useSplashScreen() {

        const { displayState, setDisplayState } = useDisplayState();

        return {
            "isSplashScreenShown": displayState.count > 0,
            "isTransparencyEnabled": displayState.isTransparencyEnabled,
            "showSplashScreen": useConstCallback((params: { enableTransparency: boolean; }) => {

                const { enableTransparency } = params;

                setDisplayState({
                    "count": displayState.count + 1,
                    "isTransparencyEnabled": enableTransparency
                });
            }),
            "hideSplashScreen": useConstCallback(() => 
                setDisplayState({
                    "count":
                        displayState.count === 0 ?
                            0 : displayState.count - 1,
                    "isTransparencyEnabled": displayState.isTransparencyEnabled
                })
            )
        };

    }

    return { useSplashScreen };

})();


const fadeOutDuration = 700;

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
    ({ theme }, { isVisible, isFadingOut, isTransparencyEnabled }) => ({
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
        }

    })
);

export const SplashScreen = memo((props: Props) => {

    const { className } = props;

    const { ref, domRect: { width, height } } = useDOMRect();

    const { isSplashScreenShown, isTransparencyEnabled } = useSplashScreen();

    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const { classNames } = useClassNames({
        isVisible,
        isFadingOut,
        //isTransparencyEnabled: isTransparencyEnabled || ( 1 === 0 +1)
        isTransparencyEnabled
    });

    //TODO: Export in evt/hooks
    const [evtIsSplashScreenShown] = useState(() => Evt.create(isSplashScreenShown));
    useEffect(() => { evtIsSplashScreenShown.state = isSplashScreenShown });

    useEvt(
        ctx => {

            let timer = setTimeout(() => { }, 0);

            evtIsSplashScreenShown
                .toStateless(ctx)
                .attach(async isSplashScreenShown => {

                    clearTimeout(timer);

                    if (isSplashScreenShown) {

                        setIsFadingOut(false);
                        setIsVisible(true);

                    } else {

                        console.log("TODO: Remove showoff splash screen delay");
                        await new Promise(resolve => timer = setTimeout(resolve, 1000));

                        setIsFadingOut(true);

                        await new Promise(resolve => timer = setTimeout(resolve, fadeOutDuration));

                        setIsFadingOut(false);
                        setIsVisible(false);

                    }

                });

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <div ref={ref} className={cx(classNames.root, className)}>
            <HeaderLogoSvg
                width={width}
                height={height * 0.2}
            />
        </div>
    );

});

