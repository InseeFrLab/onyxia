import { PageHeader } from "app/components/shared/PageHeader";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import Link from "@material-ui/core/Link";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { PageHeader },
});

export default meta;

export const Vue1 = getStory({
    "mainIcon": "secrets",
    /* spell-checker: disable */
    "title": "Catalogue de services",
    "helpIcon": "sentimentSatisfied",
    "helpTitle":
        "Explorez, lancez et configurez des services en quelques clics seulement.",
    "helpContent": (
        <>
            {" "}
            Le catalogue vous propose de déployer facilement des services{" "}
            <Link href="#">a link</Link>
        </>
    ),
    /* spell-checker: enable */
});
