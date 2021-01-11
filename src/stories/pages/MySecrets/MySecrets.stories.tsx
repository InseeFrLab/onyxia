
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "../sectionName";
import { MySecrets } from "app/pages/MySecrets";
import type { Props } from "app/pages/MySecrets";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { symToStr } from "app/utils/symToStr";

type StoryProps = {
    width: number;
    height: number;
};

const useStyles = makeStyles(
    () => createStyles<"root", StoryProps>({
        "root": ({ width, height }) => ({
            "border": "1px solid black",
            width,
            height
        })
    })
);


function Component(props: Omit<Props, "className"> & StoryProps) {

    const classes = useStyles(props);

    return <MySecrets className={classes.root} />;

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
    "width": 1200,
    "height": 900
});





