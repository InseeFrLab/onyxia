
import React from "react";
import { PageHeader } from "app/molecules/PageHeader";
import { Link } from "app/atoms/Link";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";


export default buildMeta({
    sectionName,
    "wrappedComponent": { PageHeader }
});

const { getThemedStory } = getThemedStoryFactory(PageHeader);

export const Vue1 = getThemedStory({
    "icon": "lock",
    "text1": "Mes secrets",
    /* cspell: disable-next-line */
    "text2": "Personnalisez vos configuration à l'auder de variables d'environnement",
    /* cspell: disable-next-line */
    "text3": <>Pour en savoir plus sur la génération de secrets, lisez <Link href="#">la documentation</Link></>
});

