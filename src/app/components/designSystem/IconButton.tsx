

import { createUseClassNames, cx } from "app/theme/useClassNames";
import { memo } from "react";
import MuiIconButton from "@material-ui/core/IconButton";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";

export type Props = {

    className?: string | null;

    disabled?: boolean;
    onClick: () => void;

    type: IconProps["type"];
    fontSize?: IconProps["fontSize"];

    'aria-label'?: string | null;


};

export const defaultProps: Optional<Props> = {
    "className": null,
    "disabled": false,
    "fontSize": "default",
    "aria-label": null
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    theme=>({
        "root": {
            "padding": theme.spacing(1),
            "&:hover": {
                "backgroundColor": "unset",
                "& svg": {
                    "color": theme.custom.colors.useCases.buttons.actionHoverPrimary,
                }
            }
        }
    })
);

export const IconButton =memo((props: Props) =>{

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { 
        disabled, 
        onClick, 
        type, 
        fontSize, 
        className, 
        'aria-label': ariaLabel 
    } = completedProps;

    const { classNames } = useClassNames(completedProps);

    return (
        <MuiIconButton
            className={cx(classNames.root, className)}
            disabled={disabled}
            onClick={onClick}
            aria-label={ariaLabel ?? undefined}
        >
            <Icon
                color={disabled ? "textDisabled" : "textPrimary"}
                type={type}
                fontSize={fontSize}
            />
        </MuiIconButton>
    );

});



