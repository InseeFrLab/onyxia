
import React from "react";
import { PageHeader } from "app/components/PageHeader";
import { Link } from "app/components/designSystem/Link";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";

const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { PageHeader }
});

export default meta;

export const Vue1 = getThemedStory({
    "icon": "lock",
    "text1": "foo bar",
    "text2": "bar baz",
    "text3": <> yadi yada a <Link href="#">a link</Link></>
});

