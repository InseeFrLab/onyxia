
import { useTheme } from "@material-ui/core/styles";
import { createUseClassNamesFactory } from "app/utils/jssOnTopOfEmotionCss";
export { css, cx } from "app/utils/jssOnTopOfEmotionCss";

export const { createUseClassNames } = createUseClassNamesFactory({ useTheme });

export { useTheme };


