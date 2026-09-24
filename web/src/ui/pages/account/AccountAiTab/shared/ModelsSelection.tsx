import { memo, useId } from "react";
import { Autocomplete, Checkbox, Stack, TextField } from "@mui/material";
import { Text } from "onyxia-ui/Text";
import { useTranslation, declareComponentKeys } from "ui/i18n";
import { tss } from "tss";
import { getFieldStyle } from "./fieldStyle";

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

    const isReadOnly = props.disabled || hasNoModels;

    return (
        <Stack className={cx(classes.root, props.className)}>
            <Text
                typo="label 1"
                color={isReadOnly ? "secondary" : "primary"}
                componentProps={{ id: labelId }}
            >
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
                disabled={isReadOnly}
                clearText={t("deselect all")}
                noOptionsText={t("no matching models")}
                slotProps={{
                    paper: { className: classes.paper },
                    listbox: { className: classes.listbox }
                }}
                onChange={(_event, modelIds) => {
                    props.onSelectedModelsChange(modelIds);
                }}
                renderOption={(optionProps, modelId, { selected }) => {
                    // React wants the key passed directly, not spread with the rest
                    const { key, ...optionProps_rest } = optionProps;

                    return (
                        <li key={key} {...optionProps_rest}>
                            <Checkbox
                                className={classes.checkbox}
                                checked={selected}
                                tabIndex={-1}
                                disableRipple
                            />
                            <span>{modelId}</span>
                        </li>
                    );
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        variant="filled"
                        placeholder={(() => {
                            if (hasNoModels) {
                                return t("no models available");
                            }

                            return props.selectedModels.length === 0
                                ? t("model label")
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

const useStyles = tss.withName({ ModelsSelection }).create(({ theme }) => {
    const fieldStyle = getFieldStyle({ theme });

    return {
        root: {
            gap: theme.spacing(1)
        },
        autocomplete: {
            "& .MuiFilledInput-root": {
                ...fieldStyle.frame,
                ...fieldStyle.padding,
                flexWrap: "nowrap",
                overflow: "hidden"
            },
            "& .MuiFilledInput-root:hover, & .MuiFilledInput-root.Mui-focused":
                fieldStyle.frame_hover,
            "& .MuiFilledInput-root.Mui-disabled": fieldStyle.frame_readOnly,
            "& .MuiInputBase-input::placeholder": fieldStyle.placeholder,
            // NOTE: As specific as MUI's rules: the text input only takes the room left
            "& .MuiFilledInput-root .MuiAutocomplete-input.MuiInputBase-input": {
                minWidth: 0,
                width: 0,
                padding: 0
            },
            "& .MuiAutocomplete-tag": {
                ...fieldStyle.pill,
                ...fieldStyle.embeddedControl,
                height: "auto",
                marginLeft: 0,
                marginRight: theme.spacing(1),
                "& .MuiChip-label": {
                    paddingTop: theme.spacing(1),
                    paddingBottom: theme.spacing(1)
                },
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                color: theme.colors.useCases.typography.textPrimary
            },
            // NOTE: Read-only, not greyed out: the selected models must stay readable
            "& .MuiAutocomplete-tag.Mui-disabled": {
                opacity: 1
            },
            // A long model name is truncated only when there is no room left
            "& .MuiChip-root.MuiAutocomplete-tag": {
                flexShrink: 1,
                minWidth: 0
            },
            "& span.MuiAutocomplete-tag": {
                height: "auto",
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
            },
            "& .MuiAutocomplete-popupIndicator.Mui-disabled": {
                color: theme.colors.useCases.typography.textDisabled
            }
        },
        paper: fieldStyle.menuPaper,
        listbox: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1),
            // NOTE: Doubled class, to win over MUI's listbox and option rules
            "&&": {
                padding: theme.spacing(2)
            },
            "& .MuiAutocomplete-option.MuiAutocomplete-option": {
                minHeight: "auto",
                // In a scrolling flex column: its height is its content's, never less
                flexShrink: 0,
                alignItems: "center",
                gap: theme.spacing(3),
                padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
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
    };
});
const { i18n } = declareComponentKeys<
    | "model label"
    | "no models available"
    | "no matching models"
    | "deselect all"
    | { K: "more models"; P: { count: number } }
>()({ ModelsSelection });
export type I18n = typeof i18n;
