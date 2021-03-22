
import { useTheme } from "@material-ui/core/styles";
import { createUseClassNamesFactory } from "tss-react";

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });
