
import { memo } from "react";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { useDOMRect } from "app/tools/hooks/useDOMRect";


export type Props = {
    className?: string;
};

const { useClassNames } = createUseClassNames()(
    ({ theme }) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background
        }
    })
);

export const SplashScreen = memo((props: Props) => {

    const { className } = props;


    const { ref, domRect: { width, height } } = useDOMRect();

    const { classNames } = useClassNames(props);


    return (
        <div ref={ref} className={cx(classNames.root, className)}>
            <HeaderLogoSvg
                width={width}
                height={height}
            />
        </div>
    );

});