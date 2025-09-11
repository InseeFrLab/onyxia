import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Chip,
    Box,
    Button,
    Link as MuiLink
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import { routes } from "ui/routes";
import { declareComponentKeys } from "i18nifty";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { fileSizePrettyPrint } from "ui/tools/fileSizePrettyPrint";

export type Distribution = {
    id: string;
    format: string | undefined;
    downloadUrl: string | undefined;
    accessUrl: string | undefined;
    sizeInBytes?: number;
};

export type Dataset = {
    id: string;
    title: string;
    description: string | undefined;
    keywords: string[];
    issuedDate: string | undefined;
    landingPageUrl: string | undefined;
    licenseUrl: string | undefined;
    distributions: Distribution[];
};

export const DatasetCard = ({ dataset }: { dataset: Dataset }) => {
    const {
        id,
        title,
        description,
        keywords,
        issuedDate,
        landingPageUrl,
        licenseUrl,
        distributions
    } = dataset;

    const { classes, css } = useStyles();
    const { t } = useTranslation({ DatasetCard });

    return (
        <Card>
            <CardHeader
                avatar={<Icon icon={getIconUrlByName("Folder")} size="large" />}
                title={
                    <Typography variant="h6" component="div">
                        {title ?? id}
                    </Typography>
                }
                subheader={
                    <>
                        {issuedDate &&
                            `${t("publishedOn")} ${new Date(issuedDate).toLocaleDateString()}`}

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
                        {keywords.map((kw, i) => (
                            <Chip
                                key={i}
                                label={kw}
                                size="small"
                                className={classes.keywordsChip}
                            />
                        ))}
                    </div>
                )}
                {description && <Text typo="body 2">{description}</Text>}

                {licenseUrl && (
                    <Text typo="caption">
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
            </div>
            <CardContent>
                {distributions.length > 0 && (
                    <>
                        <Text className={classes.distributionTitle} typo="label 1">
                            {t("distributions")}
                        </Text>
                        <div className={classes.distributionList}>
                            {distributions.map(dist => (
                                <div key={dist.id} className={classes.distributionBox}>
                                    <div>
                                        <Text typo="body 2">
                                            {t("format")}: {dist.format ?? t("unknown")}
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
                                            variant="contained"
                                            size="small"
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
};

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
