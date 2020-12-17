
import React from "react";
import { PageHeader } from "app/components/PageHeader";
import { Link } from "app/components/designSystem/Link";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { PageHeader }
});

export default meta;

export const Vue1 = getStory({
    "icon": "lock",
    "text1": "foo bar",
    "text2": "bar baz",
    "text3": <> yadi yada a <Link href="#">a link</Link></>
});

