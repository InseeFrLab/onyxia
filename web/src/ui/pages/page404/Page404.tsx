import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
};

export default function Page404(props: Props) {
    const { className } = props;

    const { t } = useTranslation({ Page404 });

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
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
