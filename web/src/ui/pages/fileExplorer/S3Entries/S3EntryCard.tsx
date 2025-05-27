import { tss } from "tss";
import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type DataSourceType = "personal" | "group" | "admin";

type Props = {
    title: string;
    description: string;
    path: string;
    type: DataSourceType;
    onCardClick: () => void;
};

export function S3EntryCard(props: Props) {
    const { title, description, path, type, onCardClick } = props;

    const { classes } = useStyles({ type });
    const { t } = useTranslation({ S3EntryCard });
    return (
        <Card variant="outlined" className={classes.card}>
            <CardActionArea onClick={onCardClick}>
                <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                        <Icon size="large" icon={getIconUrlByName("Storage")} />
                        <Box flex={1}>
                            <Text typo="object heading" componentProps={{ lang: "und" }}>
                                {title}
                            </Text>
                            <Text typo="body 2">{description}</Text>
                            <Text typo="body 2" className={classes.path}>
                                {`${t("space path")} : ${path}`}
                            </Text>
                        </Box>
                        <Chip
                            label={t("chip title", { type })}
                            size="medium"
                            className={classes.chip}
                        />
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

const useStyles = tss
    .withParams<{ type: DataSourceType }>()
    .withName({ DataSource: S3EntryCard })
    .create(({ theme, type }) => {
        const typeColors = {
            personal: theme.colors.useCases.alertSeverity.success.main,
            group: theme.colors.useCases.alertSeverity.info.main,
            admin: theme.colors.useCases.alertSeverity.warning.main
        };

        return {
            card: {
                borderRadius: 8,
                backgroundColor:
                    type === "personal"
                        ? alpha(typeColors.personal, 0.25)
                        : theme.colors.useCases.surfaces.surface1
            },
            path: {
                color: theme.colors.useCases.typography.textSecondary
            },
            chip: {
                backgroundColor: typeColors[type],
                color: theme.muiTheme.palette.getContrastText(typeColors[type])
            }
        };
    });

const { i18n } = declareComponentKeys<
    | {
          K: "chip title";
          P: { type: DataSourceType };
          R: string;
      }
    | "space path"
>()({
    S3EntryCard
});
export type I18n = typeof i18n;
