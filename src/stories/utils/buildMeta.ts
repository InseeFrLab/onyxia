

import type { Meta } from "@storybook/react";
import { symToStr } from "app/utils/symToStr";

export function buildMeta(params: {
    sectionName: string;
    wrappedComponent: Record<string, Meta["component"]>;
}): Meta {

    const { sectionName, wrappedComponent } = params;

    return {
        "title": `${sectionName}/${symToStr(wrappedComponent)}`,
        "component": Object.entries(wrappedComponent).map(([, component]) => component)[0]
    };

}