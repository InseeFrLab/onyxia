import { createUseClassNamesFactory } from "tss-react";
import { useOnyxiaTheme }  from "./useOnyxiaTheme";

export const { createUseClassNames } = createUseClassNamesFactory(
    { "useTheme": useOnyxiaTheme }
);