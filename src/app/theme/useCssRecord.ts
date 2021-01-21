
import { useMemo } from "react";
import { useMemoizedRecord } from "app/utils/hooks/useMemoizedRecord";
import type { Theme } from "@material-ui/core/styles";
import type { 
    Interpolation, 
    InterpolationWithTheme as InterpolationWithThemeGeneric
} from "@emotion/core";
import { useTheme } from "@material-ui/core/styles";
/** must be imported everywhere we use the css property!
 * 
 * Add the comments:
 * 
 * /** @jsxRuntime classic *\/
 * /** @jsx jsx *\/
 * 
 * See: https://github.com/mui-org/material-ui/issues/22342
 * And: https://github.com/mui-org/material-ui/issues/22342#issuecomment-763969182 (not implemented)
 */
export { jsx } from "@emotion/react";

//NOTE: For future version of @material-ui, when @emotion/core will be removed.
//import type { Interpolation as InterpolationNext } from "@emotion/serialize";

export type InterpolationWithTheme = InterpolationWithThemeGeneric<Theme>

/** 
 * 
 * Implementation of JSS createStyles() based on @emotion/react
 * 
 * /** @jsxRuntime classic *\/
 * /** @jsx jsx *\/
 * import { jsx, createUseCssRecord } from "app/theme/useCssRecord";
 * 
 * const { useCssRecord } = createUseCssRecord<Props & { color: "red" | "blue" }>()({
 *    ({ theme }, { color })=> ({
 *        "root": { color }
 *    })
 * });
 * 
 * 
 * function MyComponent(props: Props){
 * 
 *     const [ color, setColor ]= useState<"red" | "blue">("red");
 * 
 *     const { cssRecord }=useCssRecord({...props, color });
 * 
 *     return <span css={cssRecord.root}>hello world</span>;
 * 
 * }
 * 
 */
export function createUseCssRecord<Params extends Record<string, unknown>>() {

    return function<Names extends string>(
        getCssRecord: (themeWrap: { theme: Theme; }, params: Params) => Record<Names, Interpolation>
    ) {

        function useCssRecord(params: Params) {

            const theme = useTheme();

            const memoizedParams = useMemoizedRecord(params);

            const cssRecord = useMemo(
                () => getCssRecord({ theme }, memoizedParams),
                [theme, memoizedParams]
            );

            return { cssRecord };

        }

        return { useCssRecord };

    }

}

export { useTheme };
