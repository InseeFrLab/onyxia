
import React from "react";
import type { Props } from "./ExplorerItem";
import { ExplorerItem } from "./ExplorerItem";

export function explorerItemFactory(
    params: Pick<Props, "visualRepresentationOfAFile">
) {

    return { 
        "ExplorerItem": (props: Omit<Props, keyof typeof params>) => 
            <ExplorerItem {...params} {...props} />
    };

}
