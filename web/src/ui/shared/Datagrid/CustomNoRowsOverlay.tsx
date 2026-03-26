import { Text } from "onyxia-ui/Text";
import { tss } from "tss";

export function CustomNoRowsOverlay() {
    const { classes } = useStyles();
    return (
        <Text className={classes.root} typo="body 1">
            No Rows
        </Text>
    );
}

const useStyles = tss.withName({ CustomNoRowsOverlay }).create(() => ({
    root: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center"
    }
}));
