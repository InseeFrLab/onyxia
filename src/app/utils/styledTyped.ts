
import styled from "styled-components";
import type { Theme } from '@material-ui/core/styles';

export type BuildStyleSheets<Props> = (paramsWithTheme: { theme: Theme; } & Props) => string | Record<string, number | string>;

export function styledTypedMultiple<Props>(
    component: (props: Props) => JSX.Element,
    buildStyleSheets: BuildStyleSheets<Props>[]
) {

    if (buildStyleSheets.length > 4) {
        throw new Error("The maximum supported length of the buildStyleSheets array is 4");
    }

    const [
        buildStyleSheet1,
        buildStyleSheet2,
        buildStyleSheet3,
        buildStyleSheet4
    ] = buildStyleSheets;

    return styled(component)`${buildStyleSheet1 ?? false
        }${buildStyleSheet2 ?? false
        }${buildStyleSheet3 ?? false
        }${buildStyleSheet4 ?? false
        }`;

}

export function styledTyped<Props>(
    component: (props: Props) => JSX.Element,
    buildStyleSheet: BuildStyleSheets<Props>
): typeof component;
export function styledTyped<Props>(
    component: (props: Props) => JSX.Element,
    buildStyleSheets: BuildStyleSheets<Props>[]
): typeof component;
export function styledTyped<Props>(
    component: (props: Props) => JSX.Element,
    arg2: BuildStyleSheets<Props>[] | BuildStyleSheets<Props>
): any {

    return styledTypedMultiple(
        component,
        typeof arg2 === "function" ? [arg2] : arg2
    );

}

