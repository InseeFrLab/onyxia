
import { useRef, useEffect, memo } from "react";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";


export type Props = {
    className?: string;
};

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
        }

    })
);

export const SplashScreen = memo((props: Props) => {

    const { className } = props;


    const { ref, domRect: { width, height } } = useDOMRect();

    const { classNames } = useClassNames(props);

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

