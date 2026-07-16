import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export type AiModel = { id: string; name: string };

export type Models =
    | { stateDescription: "fetching" }
    | { stateDescription: "error" }
    | { stateDescription: "loaded"; availableModels: AiModel[] }
    | undefined;

export type Props = {
    models: Models;
    selectedModel: string | undefined;
    onSelectedModelChange: (modelId: string) => void | Promise<void>;
};

export const ModelsSection = memo((props: Props) => {
    const { models, selectedModel, onSelectedModelChange } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ ModelsSection });

    if (models === undefined) {
        return null;
    }

    switch (models.stateDescription) {
        case "fetching":
            return <CircularProgress size={20} />;
        case "error":
            return (
                <Text typo="body 2" className={classes.errorText}>
                    {t("models fetch error")}
                </Text>
            );
        case "loaded":
            return (
                <div className={classes.root}>
                    <Text typo="label 1">{t("model label")}</Text>
                    <div className={classes.codeFrame}>
                        <Select
                            value={selectedModel ?? ""}
                            onChange={event => onSelectedModelChange(event.target.value)}
                            size="small"
                            className={classes.modelSelect}
                            displayEmpty
                        >
                            {models.availableModels.map(({ id, name }) => (
                                <MenuItem key={id} value={id}>
                                    {name}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                </div>
            );
    }
});

const { i18n } = declareComponentKeys<
    "model label" | "not defined" | "models fetch error"
>()({
    ModelsSection
});
export type I18n = typeof i18n;

const useStyles = tss.withName({ ModelsSection }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    codeFrame: {
        minHeight: 45,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        padding: `${theme.spacing(1)}px ${theme.spacing(1.5)}px`,
        borderRadius: theme.spacing(1),
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        minWidth: 0
    },
    modelSelect: {
        flex: 1,
        minWidth: 0,
        "& .MuiOutlinedInput-notchedOutline": {
            border: "none"
        },
        "& .MuiSelect-select": {
            paddingLeft: 0
        }
    },
    errorText: {
        color: theme.colors.useCases.alertSeverity.error.main
    }
}));
