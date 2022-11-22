import { memo } from "react";
import { makeStyles, Text } from "ui/theme";
import { RoundLogo } from "ui/components/shared/RoundLogo";
import { Button } from "ui/theme";
import { useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
    packageIconUrl?: string;
    packageName: string;
    packageDescription: string;
    onRequestLaunch(): void;
    packageHomeUrl: string | undefined;
};

export const CatalogExplorerCard = memo((props: Props) => {
    const {
        className,
        packageIconUrl,
        packageName,
        packageDescription,
        packageHomeUrl,
        onRequestLaunch
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ CatalogExplorerCard });

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                {packageIconUrl !== undefined && (
                    <RoundLogo url={packageIconUrl} size="large" />
                )}
                <Text className={classes.title} typo="object heading">
                    {capitalize(packageName)}
                </Text>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.body}>
                    <Text typo="body 1" className={classes.bodyTypo}>
                        {packageDescription}
                    </Text>
                </div>
                <div className={classes.buttonsWrapper}>
                    {packageHomeUrl !== undefined && (
                        <Button
                            className={classes.learnMoreButton}
                            href={packageHomeUrl}
                            variant="ternary"
                        >
                            {t("learn more")}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onRequestLaunch}>
                        {t("launch")}
                    </Button>
                </div>
            </div>
        </div>
    );
});

export const { i18n } = declareComponentKeys<"learn more" | "launch">()({
    CatalogExplorerCard
});

const useStyles = makeStyles<void, "learnMoreButton">({
    "name": { CatalogExplorerCard }
})((theme, _params, classes) => ({
    "root": {
        "borderRadius": 8,
        "boxShadow": theme.shadows[1],
        "backgroundColor": theme.colors.useCases.surfaces.surface1,
        "&:hover": {
            "boxShadow": theme.shadows[6],
            [`& .${classes.learnMoreButton}`]: {
                "visibility": "visible"
            }
        },
        "display": "flex",
        "flexDirection": "column"
    },
    "aboveDivider": {
        "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "boxSizing": "border-box",
        "display": "flex",
        "alignItems": "center"
    },
    "title": {
        "marginLeft": theme.spacing(3)
    },
    "belowDivider": {
        "padding": theme.spacing(4),
        "paddingTop": theme.spacing(3),
        "flex": 1,
        "display": "flex",
        "flexDirection": "column",
        "overflow": "hidden"
    },
    "body": {
        "margin": 0,
        "flex": 1
        //TODO: Commented out for mozilla (longer one always have scroll in a grid)
        //"overflow": "auto"
    },
    "bodyTypo": {
        "color": theme.colors.useCases.typography.textSecondary
    },
    "buttonsWrapper": {
        "display": "flex",
        "justifyContent": "flex-end",
        "marginTop": theme.spacing(4)
    },
    "learnMoreButton": {
        "marginRight": theme.spacing(2),
        "visibility": "hidden"
    }
}));
