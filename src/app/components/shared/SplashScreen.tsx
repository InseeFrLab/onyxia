
import { useState, useRef, memo } from "react";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx, keyframes } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import Color from "color";


export type Props = {
    className?: string;
    evtAction: NonPostableEvt<"START FADING OUT">;
};


const fadeOutDuration = 500;

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
    isRemoved: boolean; 
    isFadingOut: boolean; 
    isTransparencyEnabled: boolean;
}>()(
    ({ theme }, { isRemoved, isFadingOut, isTransparencyEnabled }) => ({
        "root": {
            //"backgroundColor": theme.custom.colors.useCases.surfaces.background,

            "backgroundColor": (() => {

                const color = new Color(theme.custom.colors.useCases.surfaces.background).rgb();

                return color
                    .alpha(isTransparencyEnabled ? 0.6 : (color as any).valpha)
                    .string();

            })(),
            "backdropFilter": isTransparencyEnabled ? "blur(10px)": undefined,
            "display": "flex",
            "alignItems": "center",
            "visibility": isRemoved ? "hidden" : "visible",
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

    const [isRemoved, setIsRemoved] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const { classNames } = useClassNames({ 
        isRemoved, 
        isFadingOut, 
        "isTransparencyEnabled": true
    });

    //TODO: Make an operator fo that
    const evtAction = useEvt(ctx => {

        const evtAction = Evt.create<UnpackEvt<Props["evtAction"]>>();

        props.evtAction.attach(ctx, data => evtAction.postAsyncOnceHandled(data));

        return evtAction;

    }, [props.evtAction]);


    useEvt(
        ctx => {

            evtAction.attach(
                action => action === "START FADING OUT",
                ctx,
                async () => {

                    console.log("TODO: Remove sleep 1s, (just to show off the anim)");
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    setIsFadingOut(true);

                    await new Promise(resolve => setTimeout(resolve, fadeOutDuration));

                    setIsFadingOut(false);
                    setIsRemoved(true);

                    /*
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    setIsRemoved(false);
                    */

                }
            );
        },
        [evtAction]
    );

    const svgRef = useRef<SVGSVGElement>(null);

    if (isRemoved) {
        return null;
    }

    return (
        <div ref={ref} className={cx(classNames.root, className)}>
            <HeaderLogoSvg
                ref={svgRef}
                width={width}
                height={height * 0.2}
            />
        </div>
    );

});

