import { memo } from "react";
import { tss } from "tss";
import { RoundLogo } from "ui/shared/RoundLogo";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import {
    renderStringWithHighlights,
    type StringWithHighlights
} from "ui/tools/renderStringWithHighlights";

export type Props = {
    className?: string;
    chartNameWithHighlights: StringWithHighlights;
    chartDescriptionWithHighlights: StringWithHighlights;
    projectHomepageUrl: string | undefined;
    iconUrl: string | undefined;
    onRequestLaunch: () => void;
};

export const CatalogChartCard = memo((props: Props) => {
    const {
        className,
        chartNameWithHighlights,
        chartDescriptionWithHighlights,
        projectHomepageUrl,
        iconUrl,
        onRequestLaunch
    } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ CatalogChartCard });

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                {iconUrl !== undefined && <RoundLogo url={iconUrl} size="large" />}
                <Text
                    className={classes.title}
                    typo="object heading"
                    componentProps={{ lang: "und" }}
                >
                    {renderStringWithHighlights({
                        stringWithHighlights: chartNameWithHighlights,
                        doCapitalize: true,
                        highlightedCharClassName: classes.highlightedChar
                    })}
                </Text>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.body}>
                    <Text
                        typo="body 1"
                        className={classes.bodyTypo}
                        componentProps={{ lang: "und" }}
                    >
                        {renderStringWithHighlights({
                            stringWithHighlights: chartDescriptionWithHighlights,
                            doCapitalize: true,
                            highlightedCharClassName: classes.highlightedChar
                        })}
                    </Text>
                </div>
                <div className={classes.buttonsWrapper}>
                    {projectHomepageUrl !== undefined && (
                        <Button
                            className={classes.learnMoreButton}
                            href={projectHomepageUrl}
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

CatalogChartCard.displayName = symToStr({ CatalogChartCard });

const { i18n } = declareComponentKeys<"learn more" | "launch">()({
    CatalogChartCard
});
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ CatalogChartCard })
    .withNestedSelectors<"learnMoreButton">()
    .create(({ theme, classes }) => ({
        root: {
            borderRadius: 8,
            boxShadow: theme.shadows[1],
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                boxShadow: theme.shadows[6],
                [`& .${classes.learnMoreButton}`]: {
                    visibility: "visible"
                }
            },
            display: "flex",
            flexDirection: "column"
        },
        aboveDivider: {
            padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
            borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center"
        },
        title: {
            marginLeft: theme.spacing(3)
        },
        belowDivider: {
            padding: theme.spacing(4),
            paddingTop: theme.spacing(3),
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        },
        body: {
            margin: 0,
            flex: 1
            //TODO: Commented out for mozilla (longer one always have scroll in a grid)
            //"overflow": "auto"
        },
        bodyTypo: {
            color: theme.colors.useCases.typography.textSecondary
        },
        buttonsWrapper: {
            display: "flex",
            justifyContent: "flex-end",
            marginTop: theme.spacing(4)
        },
        learnMoreButton: {
            marginRight: theme.spacing(2),
            visibility: "hidden"
        },
        highlightedChar: {
            color: theme.colors.useCases.typography.textFocus
        }
    }));
