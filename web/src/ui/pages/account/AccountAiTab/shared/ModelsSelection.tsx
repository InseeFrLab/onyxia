import { memo, useId } from "react";
import { Autocomplete, Checkbox, Stack, TextField } from "@mui/material";
import { Text } from "onyxia-ui/Text";
import { useTranslation, declareComponentKeys } from "ui/i18n";
import { tss } from "tss";

export type Props = {
    className?: string;
    models: string[];
    selectedModels: string[];
    disabled: boolean;
    onSelectedModelsChange: (models: string[]) => void | Promise<void>;
};
export const ModelsSelection = memo((props: Props) => {
    const { t } = useTranslation({ ModelsSelection });
    const { classes, cx } = useStyles();
    const labelId = useId();

    // NOTE: The models are the source of truth, whatever the reason there is none
    // (not fetched yet, fetch error...), nothing can be selected.
    const hasNoModels = props.models.length === 0;

    return (
        <Stack className={cx(classes.root, props.className)}>
            <Text typo="label 1" componentProps={{ id: labelId }}>
                {t("model label")}
            </Text>
            <Autocomplete
                className={classes.autocomplete}
                multiple
                disableCloseOnSelect
                limitTags={3}
                getLimitTagsText={count => t("more models", { count })}
                options={props.models}
                value={props.selectedModels}
                disabled={props.disabled || hasNoModels}
                clearText={t("deselect all")}
                noOptionsText={t("no matching models")}
                slotProps={{
                    paper: { className: classes.paper },
                    listbox: { className: classes.listbox }
                }}
                onChange={(_event, modelIds) => {
                    props.onSelectedModelsChange(modelIds);
                }}
                renderOption={(optionProps, modelId, { selected }) => (
                    <li {...optionProps}>
                        <Checkbox
                            className={classes.checkbox}
                            checked={selected}
                            tabIndex={-1}
                            disableRipple
                        />
                        <span>{modelId}</span>
                    </li>
                )}
                renderInput={params => (
                    <TextField
                        {...params}
                        variant="filled"
                        placeholder={(() => {
                            if (hasNoModels) {
                                return t("no models available");
                            }

                            return props.selectedModels.length === 0
                                ? t("not defined")
                                : undefined;
                        })()}
                        slotProps={{
                            input: { disableUnderline: true, ...params.InputProps },
                            htmlInput: {
                                ...params.inputProps,
                                "aria-labelledby": labelId
                            }
                        }}
                    />
                )}
            />
        </Stack>
    );
});

const useStyles = tss.withName({ ModelsSelection }).create(({ theme }) => ({
    root: {
        gap: theme.spacing(1)
    },
    autocomplete: {
        "& .MuiFilledInput-root": {
            minHeight: 45,
            flexWrap: "nowrap",
            overflow: "hidden",
            padding: `${theme.spacing(2)}px ${theme.spacing(2.5)}px`,
            borderRadius: theme.spacing(2),
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        "& .MuiFilledInput-root:hover, & .MuiFilledInput-root.Mui-focused": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        "& .MuiAutocomplete-input": {
            minWidth: "0 !important",
            width: "0 !important",
            padding: "0 !important"
        },
        "& .MuiAutocomplete-tag": {
            height: 28,
            maxWidth: 120,
            margin: `0 ${theme.spacing(1)}px 0 0`,
            borderRadius: 100,
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        "& .MuiChip-root.MuiAutocomplete-tag": {
            flexShrink: 1
        },
        "& span.MuiAutocomplete-tag": {
            height: "auto",
            maxWidth: "none",
            flexShrink: 0,
            marginRight: theme.spacing(1),
            padding: 0,
            borderRadius: 0,
            ...theme.typography.variants["body 1"].style,
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: "transparent",
            whiteSpace: "nowrap"
        },

        "& .MuiAutocomplete-clearIndicator": {
            visibility: "visible",
            opacity: 1,
            color: theme.colors.useCases.typography.textPrimary
        },
        "& .MuiAutocomplete-popupIndicator": {
            color: theme.colors.useCases.typography.textPrimary
        }
    },
    paper: {
        marginTop: theme.spacing(1),
        borderRadius: theme.spacing(2.5),
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        backgroundImage: "none",
        boxShadow: "0 4px 8px rgba(34, 38, 47, 0.1)"
    },
    listbox: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        padding: `${theme.spacing(2)}px !important`,
        "& .MuiAutocomplete-option": {
            minHeight: "32px !important",
            alignItems: "center",
            gap: theme.spacing(3),
            padding: `${theme.spacing(1)}px ${theme.spacing(2)}px !important`,
            borderRadius: theme.spacing(2),
            ...theme.typography.variants["label 1"].style,
            color: theme.colors.useCases.typography.textPrimary
        },
        "& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option[aria-selected='true'], & .MuiAutocomplete-option[aria-selected='true'].Mui-focused":
            {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
            }
    },
    checkbox: {
        padding: 0
    }
}));
const { i18n } = declareComponentKeys<
    | "model label"
    | "not defined"
    | "no models available"
    | "no matching models"
    | "deselect all"
    | { K: "more models"; P: { count: number } }
>()({ ModelsSelection });
export type I18n = typeof i18n;
