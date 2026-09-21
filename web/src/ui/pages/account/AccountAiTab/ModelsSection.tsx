import { memo } from "react";
import { Autocomplete, Stack, TextField } from "@mui/material";
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
        <Stack>
            <Autocomplete
                multiple
                disableCloseOnSelect
                filterSelectedOptions
                options={props.models.map(({ id }) => id)}
                value={props.selectedModels}
                disabled={props.disabled}
                onChange={(_event, modelIds) => {
                    props.onSelectedModelsChange(modelIds);
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        label={t("model label")}
                        placeholder={
                            props.selectedModels.length === 0
                                ? t("not defined")
                                : undefined
                        }
                    />
                )}
            />
        </Stack>
    );
});
const { i18n } = declareComponentKeys<
    "model label" | "not defined" | "models fetch error"
>()({ ModelsSection });
export type I18n = typeof i18n;
