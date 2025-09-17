import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys } from "i18nifty";

export default function Page404() {
    const { t } = useTranslation({ Page404 });

    const { classes } = useStyles();

    return (
        <div className={classes.root}>
            <Text typo="display heading">{t("not found")} 😥</Text>
        </div>
    );
}

const useStyles = tss.withName({ Page404 }).create(({ theme }) => ({
    root: {
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.useCases.surfaces.background
    }
}));

const { i18n } = declareComponentKeys<"not found">()({ Page404 });
export type I18n = typeof i18n;
