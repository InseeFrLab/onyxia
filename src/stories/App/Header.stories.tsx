

import { Header } from "app/components/App/Header";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "app/theme/useClassNames";
import { useIsDarkModeEnabled } from "app/tools/hooks/useIsDarkModeEnabled";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Header }
});

export default meta;

const width = 1000;

const logoMaxWidth= width * 4 /100;
const paddingRight = width * 2 / 100;

export const Vue1 = getStory({
    "className": css({ width, "height": 64, paddingRight }),
    "isUserLoggedIn": false,
    useIsDarkModeEnabled,
    logoMaxWidth,
    ...logCallbacks(["onClick"])
});

