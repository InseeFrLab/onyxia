import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";

export function CustomNoRowsOverlay() {
    const { classes } = useStyles();
    const { t } = useTranslation({ CustomNoRowsOverlay });

    return (
        <Text className={classes.root} typo="body 1">
            {t("no rows")}
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

const { i18n } = declareComponentKeys<"no rows">()({ CustomNoRowsOverlay });
export type I18n = typeof i18n;
