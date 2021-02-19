

import { memo } from "react";
import MuiInput from "@material-ui/core/Input";
import type { Optional } from "evt/tools/typeSafety";
import { CircularProgress } from "../CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import { noUndefined } from "app/tools/noUndefined";
import { useCommonInputLogic } from "./useCommonInputLogic";
import { Props as CommonProps, defaultProps as defaultCommonProps } from "./useCommonInputLogic";

export type InputProps = CommonProps & {
    isCircularProgressShown?: boolean;
};

const defaultProps: Optional<InputProps> = {
    ...defaultCommonProps,
    "isCircularProgressShown": false
};

export const Input = memo((props: InputProps) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { isCircularProgressShown, ...completedCommonProps } = completedProps;

    const commonMuiProps = useCommonInputLogic(completedCommonProps);

    return (
        <MuiInput
            {...commonMuiProps}
            endAdornment={
                !isCircularProgressShown ? undefined :
                    <InputAdornment position="end">
                        <CircularProgress color="textPrimary" size={10} />
                    </InputAdornment>
            }
        />
    );

});
