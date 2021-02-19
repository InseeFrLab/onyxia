
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { forwardRef, memo } from "react";
import MuiTypography from "@material-ui/core/Typography";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";

export type Props = {
    className?: string | null;
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "body1" | "caption";
    color?: "primary" | "secondary" | "disabled" | "focus"
    children: NonNullable<React.ReactNode>;
    onClick?: (() => void) | null;
};

export const defaultProps: Optional<Props> = {
    "className": null,
    "variant": "body1",
    "color": "primary",
    "onClick": null,
};


const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme }, { color, onClick }) => ({
        "root": {
            "color": theme.custom.colors.useCases.typography[(() => {
                switch (color) {
                    case "primary": return "textPrimary";
                    case "secondary": return "textSecondary";
                    case "disabled": return "textDisabled";
                    case "focus": return "textFocus";
                }
            })()],
            "cursor": onClick !== null ? "pointer" : undefined,
        }
    })
);

export const Typography = memo(forwardRef<any, Props>((props, ref) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const {
        children, variant, className,
        //For the forwarding, rest should be empty (typewise)
        color,
        onClick,
        ...rest
    } = completedProps;

    const { classNames } = useClassNames(completedProps);

    return (
        <MuiTypography
            className={cx(classNames.root, className)}
            ref={ref}
            variant={variant}
            onClick={onClick ?? undefined}
            {...rest}
        >
            {children}
        </MuiTypography>
    );

}));
