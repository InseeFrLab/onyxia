import { DoubleSlider } from "app/components/shared/DoubleSlider";
import type { DoubleSliderProps } from "app/components/shared/DoubleSlider";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { useState } from "react";
import { symToStr } from "tsafe/symToStr";
import { makeStyles } from "app/theme";

const useStyles = makeStyles()(theme => ({
    "span": {
        "color": theme.colors.useCases.typography.textSecondary,
    },
}));

function Component(
    props: Omit<
        DoubleSliderProps,
        "label" | "valueDown" | "valueUp" | "setValueDown" | "setValueUp"
    >,
) {
    const [valueDown, setValueDown] = useState(props.min);
    const [valueUp, setValueUp] = useState(props.max);

    const { classes } = useStyles();

    return (
        <DoubleSlider
            {...props}
            label={
                <>
                    <span className={classes.span}>Down: </span>
                    {"The amount of memory guaranteed"}
                    &nbsp;|&nbsp;
                    <span className={classes.span}>Up: </span>
                    {"The maximum amount of memory"}
                    &nbsp;|&nbsp;
                    <span className={classes.span}>Unit: </span>
                    {"Gi"}
                </>
            }
            valueDown={valueDown}
            setValueDown={setValueDown}
            valueUp={valueUp}
            setValueUp={setValueUp}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ DoubleSlider })]: Component },
});

export default meta;

export const Vue1 = getStory({
    //"label": "The amount of memory guaranteed - The maximum amount of cpu | Unit: Gi",
    "min": 1,
    "max": 200,
    "step": 20,
});
