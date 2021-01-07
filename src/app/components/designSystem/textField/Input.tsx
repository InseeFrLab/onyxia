

import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiInput from "@material-ui/core/Input";
import type { InputClassKey } from "@material-ui/core/Input";
import type { Id, Optional } from "evt/tools/typeSafety";
import { CircularProgress } from "../CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import { noUndefined } from "app/utils/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";

export type InputProps = CommonProps & {
    isCircularProgressShown?: boolean;
};

const defaultProps: Optional<InputProps> = {
    ...defaultCommonProps,
    "isCircularProgressShown": false,
};

const useStyles = makeStyles(
    () => createStyles<Id<InputClassKey, "root">, Required<InputProps>>({
        "root": {
        }
    })
);

export function Input(props: InputProps) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { isCircularProgressShown, ...completedCommonProps } = completedProps;

    const classes = useStyles(completedProps);

    const commonMuiProps = useCommonInputLogic(completedCommonProps);

    return (
        <MuiInput
            {...commonMuiProps}
            classes={classes}
            endAdornment={
                !isCircularProgressShown ? undefined :
                    <InputAdornment position="end">
                        <CircularProgress color="textPrimary" size={10} />
                    </InputAdornment>
            }
        />
    );

}
