
import React, { useCallback } from "react";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import MuiTextField from "@material-ui/core/TextField";
//import type { TextFieldProps} from "@material-ui/core/TextField";
import type { TextFieldClassKey } from "@material-ui/core/TextField";
import type { Id, Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";

export type Props = {
  autoFocus?: boolean;
  label: string;
  fullWidth?: boolean;
  error?: boolean;
  onChange(text: string): void;
};

export const defaultProps: Optional<Props> = {
  "autoFocus": false,
  "fullWidth": false,
  "error": false
};


const useStyles = makeStyles(
  () => createStyles<Id<TextFieldClassKey, "root">, Required<Props>>({
    "root": {
    }
  })
);


export function TextField(props: Props) {

  const completedProps = { ...defaultProps, ...noUndefined(props) };

  const { autoFocus, label, fullWidth, error, onChange } = completedProps;

  const classes = useStyles(completedProps);

  return (
    <MuiTextField
      classes={classes}
      autoFocus={autoFocus}
      label={label}
      type="text"
      fullWidth={fullWidth}
      error={error}
      onChange={useCallback(
        ({ target }: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
          onChange(target.value),
        [onChange]
      )}
    />
  );

}






