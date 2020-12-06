

import React from "react";
import { ExplorerItems, Props } from "app/molecules/ExplorerItems";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default {
    ...buildMeta({
        sectionName,
        "wrappedComponent": { ExplorerItems }
    }),
    // https://storybook.js.org/docs/react/essentials/controls
    "argTypes": {
        "containerWidth": {
            "control": "range",
            "min": 10,
            "max": 100
        }
    }
};

const { getThemedStory } = getThemedStoryFactory(
    (props: Props & { containerWidth: number; }) =>
        <div style={{ width: `${props.containerWidth}vw` }}>
            <ExplorerItems {...props} />
        </div>
);

export const Vue1 = getThemedStory({
    "containerWidth": 50,
    "visualRepresentationOfAFile": "secret",
    "directories": ["dir1", "dir2", "dir3"],
    "files": ["file1", "file2", "file3"],
    "onOpen": console.log
});
