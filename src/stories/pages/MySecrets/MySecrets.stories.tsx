
import { css } from "app/theme/useClassNames";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "../sectionName";
import { MySecrets } from "app/components/pages/MySecrets";
import type { Props } from "app/components/pages/MySecrets";
import { symToStr } from "app/tools/symToStr";
import { SplashScreen } from "app/components/shared/SplashScreen";

type StoryProps = {
    width: number;
    height: number;
};

function Component(props: Omit<Props, "className" | "route" | "splashScreen"> & StoryProps) {

    const { width, height } = props;

    return <MySecrets
        route={null as any}
        splashScreen={<SplashScreen css={{ "height": "100%" }} />}
        className={css({
            width,
            height
        })}
    />;

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "doProvideMockStore": true,
    "wrappedComponent": { [symToStr({ MySecrets })]: Component }
});


export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920
            }
        },
        "height": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1080
            }
        }

    }
};

export const Vue1 = getStory({
    "width": 1400,
    "height": 1100
});





