import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import { routes } from "ui/routes";
import { declareComponentKeys } from "i18nifty";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";
import { useTranslation, useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import { Markdown } from "ui/shared/Markdown";
import { forwardRef, memo, type CSSProperties } from "react";

export type Distribution = {
    id: string;
    format: string | undefined;
    downloadUrl: string | undefined;
    accessUrl: string | undefined;
    sizeInBytes?: number;
};

export type Dataset = {
    id: string;
    title: LocalizedString;
    description: LocalizedString | undefined;
    keywords: LocalizedString[] | undefined;
    issuedDate: string | undefined;
    landingPageUrl: string | undefined;
    licenseUrl: string | undefined;
    distributions: Distribution[];
};

type Props = {
    className?: string;
    dataset: Dataset;
    style?: CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;
export const DatasetCard = memo(
    forwardRef<HTMLDivElement, Props>((props, ref) => {
        const {
            className,
            dataset: {
                id,
                title,
                description,
                keywords = [],
                issuedDate,
                landingPageUrl,
                licenseUrl,
                distributions
            },
            style,
            ...rest
        } = props;

        const { classes, css } = useStyles();
        const { t } = useTranslation({ DatasetCard });
        const { resolveLocalizedString } = useResolveLocalizedString();

        return (
            <Card ref={ref} className={className} style={style} {...rest}>
                <CardHeader
                    avatar={<Icon icon={getIconUrlByName("Folder")} size="large" />}
                    title={
                        <Text typo="object heading">
                            {resolveLocalizedString(title ?? id)}
                        </Text>
                    }
                    subheader={
                        <>
                            {issuedDate &&
                                `${t("publishedOn")} ${new Date(issuedDate).toLocaleDateString()}`}

                            {licenseUrl && (
                                <Text typo="body 2">
                                    {t("license")}{" "}
                                    <MuiLink
                                        href={licenseUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {licenseUrl}
                                    </MuiLink>
                                </Text>
                            )}

                            {landingPageUrl && (
                                <a
                                    href={landingPageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={classes.landingPageUrl}
                                >
                                    <Text typo="body 2">
                                        {t("datasetPage")}
                                        <Icon
                                            icon={getIconUrlByName("OpenInNew")}
                                            className={css({
                                                fontSize: "inherit",
                                                width: "0.7em",
                                                height: "0.7em"
                                            })}
                                        />
                                    </Text>
                                </a>
                            )}
                        </>
                    }
                />
                <div className={classes.content}>
                    {keywords.length > 0 && (
                        <div className={classes.keywoardsWrapper}>
                            {keywords.map(kw => {
                                const strKeyword = resolveLocalizedString(kw);
                                return (
                                    <Chip
                                        key={strKeyword}
                                        label={strKeyword}
                                        size="small"
                                        className={classes.keywordsChip}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {description && (
                        <Markdown>{resolveLocalizedString(description)}</Markdown>
                    )}
                </div>
                <CardContent>
                    {distributions.length > 0 && (
                        <>
                            <Text className={classes.distributionTitle} typo="label 1">
                                {t("distributions")}
                            </Text>
                            <div className={classes.distributionList}>
                                {distributions.map(dist => (
                                    <div
                                        key={dist.id}
                                        className={classes.distributionBox}
                                    >
                                        <div>
                                            <Text typo="body 2">
                                                {t("format")}:{" "}
                                                {dist.format ?? t("unknown")}
                                            </Text>

                                            {dist.sizeInBytes !== undefined && (
                                                <Text typo="caption">
                                                    {t("size")}:{" "}
                                                    {(() => {
                                                        const { value, unit } =
                                                            fileSizePrettyPrint({
                                                                bytes: dist.sizeInBytes
                                                            });
                                                        return `${value} ${unit}`;
                                                    })()}
                                                </Text>
                                            )}
                                        </div>
                                        {dist.downloadUrl && (
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    routes
                                                        .dataExplorer({
                                                            source: dist.downloadUrl
                                                        })
                                                        .push();
                                                }}
                                            >
                                                {t("visualize")}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    })
);

const useStyles = tss.withName({ DatasetCard }).create(({ theme }) => ({
    content: {
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4)
    },
    landingPageUrl: {
        display: "flex",
        color: theme.colors.useCases.typography.textPrimary,
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline"
        }
    },
    keywoardsWrapper: {
        display: "inline-flex",
        flexWrap: "wrap",
        gap: theme.spacing(1),
        marginBottom: theme.spacing(2)
    },
    keywordsChip: {
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    distributionTitle: {
        marginBottom: theme.spacing(2)
    },
    distributionList: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2)
    },
    distributionBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing(2),
        borderLeft: `4px solid ${theme.muiTheme.palette.primary.main}`
    }
}));

const { i18n } = declareComponentKeys<
    | "publishedOn"
    | "datasetPage"
    | "license"
    | "format"
    | "size"
    | "distributions"
    | "visualize"
    | "unknown"
>()({ DatasetCard });
export type I18n = typeof i18n;
