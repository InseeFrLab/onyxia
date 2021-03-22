
import { Paper, defaultProps } from "app/components/designSystem/Paper";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Paper }
});

export default meta;


export const Vue1 = getStory({
    ...defaultProps,
    "children": <div className={css({ "width": 400, "height": 400 })}></div>,
    "elevation": 3
});

