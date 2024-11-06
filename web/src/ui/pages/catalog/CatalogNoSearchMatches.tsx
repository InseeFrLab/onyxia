import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import serviceNotFoundSvgUrl from "ui/assets/svg/ServiceNotFound.svg";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import MuiLink from "@mui/material/Link";

type Props = {
    search: string;
    onGoBackClick(): void;
};

export function CatalogNoSearchMatches(props: Props) {
    const { search, onGoBackClick } = props;

    const { classes } = useStyles();

    const { t } = useTranslation({ CatalogNoSearchMatches });

    return (
        <div className={classes.root}>
            <div className={classes.innerDiv}>
                <ThemedImage className={classes.svg} url={serviceNotFoundSvgUrl} />
                <Text typo="page heading" className={classes.h2}>
                    {t("no service found")}
                </Text>
                <Text className={classes.typo} typo="body 1">
                    {t("no result found", { forWhat: search })}
                </Text>
                <Text className={classes.typo} typo="body 1">
                    {t("check spelling")}
                </Text>
                <MuiLink className={classes.link} onClick={onGoBackClick}>
                    {t("go back")}
                </MuiLink>
            </div>
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "no service found"
    | { K: "no result found"; P: { forWhat: string } }
    | "check spelling"
    | "go back"
>()({ CatalogNoSearchMatches });
export type I18n = typeof i18n;

const useStyles = tss.withName({ CatalogNoSearchMatches }).create(({ theme }) => ({
    root: {
        display: "flex",
        justifyContent: "center"
    },
    innerDiv: {
        textAlign: "center",
        maxWidth: 500
    },
    svg: {
        fill: theme.colors.palette.dark.greyVariant2,
        width: 100,
        margin: 0
    },
    h2: {
        ...theme.spacing.topBottom("margin", 4)
    },
    typo: {
        marginBottom: theme.spacing(1),
        color: theme.colors.palette.light.greyVariant3
    },
    link: {
        cursor: "pointer"
    }
}));
