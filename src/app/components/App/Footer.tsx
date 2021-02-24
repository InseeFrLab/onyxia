

import { memo } from "react";
import { createUseClassNames, cx } from "app/theme/useClassNames";



export type Props = {
    className?: string;
}

const { useClassNames } = createUseClassNames<Props>()(
    (theme) => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
            "border": "1px solid white"
        }
    })
);



export const Footer = memo((props: Props) => {

    const { className } = props;

    const { classNames } = useClassNames(props);

    return (
        <footer className={cx(classNames.root, className)}>
        </footer>
    );


});