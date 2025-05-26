import { declareComponentKeys } from "i18nifty";
import { tss } from "tss";
import { Box, Card, CardActionArea, CardContent, Chip, Typography } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";

type DataSourceType = "personal" | "group" | "admin" | "custom";

const badgeLabelMap: Record<DataSourceType, string> = {
    personal: "Personal",
    group: "Group",
    admin: "Admin",
    custom: "Custom"
};

type Props = {
    title: string;
    description: string;
    path: string;
    type: DataSourceType;
};

export function Datasource(props: Props) {
    const { title, description, path, type } = props;

    const { classes } = useStyles({ type });
    return (
        <Card className={classes.card} variant="outlined">
            <CardActionArea
                onClick={() => console.log("onCLick")}
                className={classes.actionArea}
            >
                <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                        <StorageIcon color="primary" />
                        <Box flex={1}>
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="h6" component="div" gutterBottom>
                                    {title}
                                </Typography>
                                <Chip
                                    label={badgeLabelMap[type]}
                                    size="small"
                                    className={classes.chip}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {description}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                className={classes.path}
                            >
                                {path}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

const useStyles = tss
    .withParams<{ type: DataSourceType }>()
    .withName({ Datasource })
    .create(({ theme, type }) => ({
        card: {
            backgroundColor: theme.muiTheme.palette.background.paper,
            transition: "border 0.2s"
        },
        actionArea: {
            height: "100%"
        },
        path: {
            fontFamily: "monospace",
            display: "block",
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1)
        },
        chip: {
            backgroundColor: {
                personal: theme.muiTheme.palette.success.dark,
                group: theme.muiTheme.palette.info.dark,
                admin: theme.muiTheme.palette.grey[700],
                custom: theme.muiTheme.palette.warning.dark
            }[type],
            color: theme.muiTheme.palette.getContrastText(
                {
                    personal: theme.muiTheme.palette.success.dark,
                    group: theme.muiTheme.palette.info.dark,
                    admin: theme.muiTheme.palette.grey[700],
                    custom: theme.muiTheme.palette.warning.dark
                }[type]
            )
        }
    }));

const { i18n } = declareComponentKeys<"">()({ Datasource });
export type I18n = typeof i18n;
