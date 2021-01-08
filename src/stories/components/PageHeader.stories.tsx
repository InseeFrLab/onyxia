
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
    "icon": "secrets",
    /* spell-checker: disable */
    "text1": "Catalogue de services",
    "text2": "Explorez, lancez et configurez des services en quelques clics seulement.",
    "text3": <> Le catalogue vous propose de déployer facilement des services  <Link href="#">a link</Link></>
    /* spell-checker: enable */
});

