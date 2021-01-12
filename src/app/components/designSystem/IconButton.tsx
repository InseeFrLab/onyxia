
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiIconButton from "@material-ui/core/IconButton";
import type { IconButtonClassKey } from "@material-ui/core/IconButton";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import type { Props as IconProps } from "./Icon";
import { Icon } from "./Icon";

export type Props = {

    className?: string | null;

    disabled?: boolean;
    onClick: () => void;

    type: IconProps["type"];
    fontSize?: IconProps["fontSize"];


};

export const defaultProps: Optional<Props> = {
    "className": null,
    "disabled": false,
    "fontSize": "default"
};


const useIconButtonStyles = makeStyles(
    theme => createStyles<Id<IconButtonClassKey, "root">, Required<Props>>({
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


const useStyles = makeStyles(
    () => createStyles<"root", Required<Props>>({
        "root": {
        }
    })
);


export function IconButton(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { className, disabled, onClick, type, fontSize } = completedProps;

    const iconButtonClasses = useIconButtonStyles(completedProps);
    const classes= useStyles(completedProps);

    return (
        <MuiIconButton
            className={className ?? undefined}
            classes={iconButtonClasses}
            disabled={disabled}
            onClick={onClick}
        >
            <Icon
                className={classes.root}
                color={disabled ? "textDisabled" : "textPrimary"}
                type={type}
                fontSize={fontSize}
            />
        </MuiIconButton>
    );

}






