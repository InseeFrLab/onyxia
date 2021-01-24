
import { PageHeader } from "app/components/PageHeader";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import Link from "@material-ui/core/Link";

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

