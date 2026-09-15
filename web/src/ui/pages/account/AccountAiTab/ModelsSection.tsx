import { memo } from "react";
import { Select, MenuItem, Checkbox, ListItemText, Stack } from "@mui/material";
import { Text } from "onyxia-ui/Text";
import { useTranslation, declareComponentKeys } from "ui/i18n";
import type { AiModel } from "core/tools/fetchAiModels";
export type Props = {
    models: AiModel[];
    selectedModels: string[];
    disabled: boolean;
    onSelectedModelsChange: (models: string[]) => void | Promise<void>;
};
export const ModelsSection = memo((props: Props) => {
    const { t } = useTranslation({ ModelsSection });

    return (
        <Stack spacing={1}>
            <Text typo="label 1">{t("model label")}</Text>
            <Select
                multiple
                displayEmpty
                value={props.selectedModels}
                disabled={props.disabled}
                inputProps={{ "aria-label": t("model label") }}
                renderValue={ids =>
                    ids.length === 0 ? t("not defined") : ids.join(", ")
                }
                onChange={event => {
                    const value = event.target.value;
                    void props.onSelectedModelsChange(
                        typeof value === "string" ? value.split(",") : value
                    );
                }}
            >
                {props.models.map(model => (
                    <MenuItem key={model.id} value={model.id}>
                        <Checkbox checked={props.selectedModels.includes(model.id)} />
                        <ListItemText primary={model.name} />
                    </MenuItem>
                ))}
            </Select>
        </Stack>
    );
});
const { i18n } = declareComponentKeys<
    "model label" | "not defined" | "models fetch error"
>()({ ModelsSection });
export type I18n = typeof i18n;
