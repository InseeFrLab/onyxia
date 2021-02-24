
import { useTheme } from "@material-ui/core/styles";
import { createUseClassNamesFactory } from "jss-emotion/createUseClassNamesFactory_optimized";
export { css, cx, keyframes } from "jss-emotion";

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });
