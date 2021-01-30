
import { useTheme } from "@material-ui/core/styles";
import { createUseClassNamesFactory } from "app/tools/jssOnTopOfEmotionCss";
export { css, cx } from "app/tools/jssOnTopOfEmotionCss";

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });

export { useTheme };


