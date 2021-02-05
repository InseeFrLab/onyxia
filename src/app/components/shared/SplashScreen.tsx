
import { useState, useRef, useEffect, memo } from "react";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";


export type Props = {
    className?: string;
    evtAction: NonPostableEvt<"START FADING OUT">;
};

const fadeOutDuration = 500;

const { useClassNames } = createUseClassNames()(
    ({ theme }) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
            "display": "flex",
            "alignItems": "center"
        },
        "step1": {
            "opacity": 0
        },
        "step2": {
            "opacity": 1,
            "transition": "opacity ease-in-out 0.5s",
        },
        "step3": {
            "opacity": 0,
            "transition": "opacity ease-in-out 0.5s"
        },
        "fadeOut": {
            "opacity": "0",
            "transition": `opacity ease-in-out ${fadeOutDuration}ms`,
        }

    })
);

export const SplashScreen = memo((props: Props) => {

    const { className } = props;

    const { ref, domRect: { width, height } } = useDOMRect();

    const { classNames } = useClassNames(props);

    const [isRemoved, setIsRemoved] = useState(false);

    //TODO: Make an operator fo that
    const evtAction = useEvt(ctx => {

        const evtAction = Evt.create<UnpackEvt<Props["evtAction"]>>();

        props.evtAction.attach(ctx, data => evtAction.postAsyncOnceHandled(data));

        return evtAction;

    }, [props.evtAction]);

    const [htmlRootDivElement, setHtmlElement] =useState<HTMLDivElement | null>(null);

    useEffect(
        () => { setHtmlElement(ref.current); },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ref.current]
    );

    useEvt(
        ctx=> {

            if( htmlRootDivElement === null ){
                return;
            }

            evtAction.attach(
                action=> action === "START FADING OUT",
                ctx,
                async ()=>{

                    console.log("TODO: Remove sleep 1s, (just to show off the anim)");
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    htmlRootDivElement.classList.add(classNames.fadeOut);

                    setTimeout(() => setIsRemoved(true), fadeOutDuration);


                }
            );
        },
        [evtAction, classNames.fadeOut, htmlRootDivElement]
    );

    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(
        () => {

            let isUnmounted = false;

            const gs = svgRef.current!.querySelectorAll("g");

            (function callee() {



                gs.forEach((g, idx) => {

                    g.removeAttribute("class");

                    g.classList.add(classNames.step1);

                    setTimeout(
                        () => g.classList.add(classNames.step2),
                        (idx + 1) * 400
                    );

                })

                setTimeout(() => {
                    gs.forEach((g, idx) => {

                        setTimeout(() => {
                            g.classList.remove(classNames.step2);
                            g.classList.add(classNames.step3);
                        }, (idx + 1) * 200);


                    })

                    setTimeout(
                        () => {
                            if (isUnmounted) {
                                return;
                            }
                            callee();
                        },
                        1000
                    );

                }, 2000)

            })();

            return function cleanup() {
                isUnmounted = true;
            }

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    if( isRemoved ){
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

