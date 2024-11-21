import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";

export function CustomNoRowsOverlay() {
    const { t } = useTranslation("ExplorerItems");

    const { classes } = useStyles();
    return (
        <Text className={classes.root} typo="body 1">
            {t("empty directory")}
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
