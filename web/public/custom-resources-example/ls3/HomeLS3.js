
/** @typedef {import("../../../src/pluginSystem").Onyxia} Onyxia */

/** @param {Onyxia} onyxia */
export async function createHomeLS3(onyxia) {

    const [
        React,
        { tss },
        { Text }
    ] = await Promise.all([
        onyxia.import("react"),
        onyxia.import("tss"),
        onyxia.import("onyxia-ui/Text"),
    ]);

    function HomeLS3() {

        const { classes } = useStyles();

        return React.createElement(
            Text,
            {
                typo: "object heading",
                className: classes.root,
                children: "My Alternative Home With Onyxia-ui Text"
            }
        );
    }

    const useStyles = tss
        .withName({ HomeLS3 })
        .create(() => ({
            root: {
                margin: 0,
                padding: 0,
                border: "4px solid red",
                height: "100%"
            }
        }));

    return { HomeLS3 };

}
