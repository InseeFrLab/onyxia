
import { Button, defaultProps } from "app/components/designSystem/Button";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Button }
});

export default meta;


export const Vue1 = getStory({
    ...defaultProps,
    "children": "Foo bar",
    "startIcon": "home",
    "onClick": console.log.bind(null,"click!")
});

