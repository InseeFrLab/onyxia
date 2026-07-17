import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useId } from "react";
import { tss } from "tss";
import type { AiModel } from "./types";

export function FormTextField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    isSensitive?: boolean;
}) {
    const { label, value, onChange, autoComplete, isSensitive = false } = props;
    const inputId = useId();
    const { classes } = useStyles();

    return (
        <Input
            id={inputId}
            className={classes.input}
            value={value}
            placeholder={label}
            onChange={event => onChange(event.target.value)}
            type={isSensitive ? "password" : "text"}
            fullWidth={true}
            disableUnderline={true}
            autoComplete={autoComplete}
            inputProps={{ "aria-label": label }}
        />
    );
}

export function FormSelectField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    const { label, value, onChange, options } = props;
    const { classes } = useStyles();

    return (
        <FormControl fullWidth={true} className={classes.selectControl}>
            <Select<string>
                value={value}
                displayEmpty={true}
                onChange={event => onChange(event.target.value)}
                inputProps={{ "aria-label": label }}
                renderValue={selectedValue =>
                    selectedValue === ""
                        ? label
                        : (options.find(option => option.value === selectedValue)
                              ?.label ?? selectedValue)
                }
            >
                {options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export function ModelSelectField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    models: AiModel[];
    disabled: boolean;
}) {
    const { label, value, onChange, models, disabled } = props;
    const { classes } = useStyles();

    return (
        <FormControl
            fullWidth={true}
            disabled={disabled}
            className={classes.selectControl}
        >
            <Select<string>
                value={value}
                displayEmpty={true}
                onChange={event => onChange(event.target.value)}
                inputProps={{ "aria-label": label }}
                renderValue={selectedValue => {
                    if (selectedValue === "") {
                        return label;
                    }

                    const model = models.find(model => model.id === selectedValue);

                    return model?.name ?? selectedValue;
                }}
                MenuProps={{
                    PaperProps: { className: classes.modelMenu }
                }}
            >
                {models.map(model => (
                    <MenuItem
                        key={model.id}
                        value={model.id}
                        className={classes.modelMenuItem}
                    >
                        {model.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

const useStyles = tss
    .withName({ CustomProviderFormFields: FormTextField })
    .create(({ theme }) => {
        const fieldBackground = theme.colors.useCases.surfaces.background;

        return {
            input: {
                minHeight: 45,
                borderRadius: 8,
                border: "2px solid transparent",
                backgroundColor: fieldBackground,
                transition: "border-color 160ms ease, background-color 160ms ease",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                },
                "&.Mui-focused": {
                    borderColor: theme.colors.useCases.buttons.actionActive
                },
                "& .MuiInputBase-input": {
                    ...theme.typography.variants["body 2"].style,
                    padding: `${theme.spacing(1.25)}px ${theme.spacing(1.5)}px`,
                    color: theme.colors.useCases.typography.textPrimary,
                    "&::placeholder": {
                        color: theme.colors.useCases.typography.textSecondary,
                        opacity: 1
                    }
                }
            },
            selectControl: {
                "& .MuiInputBase-root": {
                    minHeight: 45,
                    borderRadius: 8,
                    backgroundColor: fieldBackground,
                    color: theme.colors.useCases.typography.textPrimary
                },
                "& .MuiOutlinedInput-notchedOutline": {
                    border: "2px solid transparent"
                },
                "& .MuiInputBase-root:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.colors.useCases.buttons.actionActive
                },
                "& .MuiSelect-select": {
                    ...theme.typography.variants["body 2"].style,
                    display: "flex",
                    alignItems: "center",
                    minHeight: "unset",
                    padding: `${theme.spacing(1.25)}px ${theme.spacing(
                        5
                    )}px ${theme.spacing(1.25)}px ${theme.spacing(1.5)}px`
                },
                "& .MuiSelect-icon": {
                    color: theme.colors.useCases.typography.textPrimary,
                    right: theme.spacing(1.5)
                },
                "& .Mui-disabled": {
                    color: theme.colors.useCases.typography.textDisabled,
                    WebkitTextFillColor: theme.colors.useCases.typography.textDisabled
                }
            },
            modelMenu: {
                marginTop: theme.spacing(0.5),
                padding: theme.spacing(0.5),
                borderRadius: 8,
                backgroundColor: theme.colors.useCases.surfaces.surface1
            },
            modelMenuItem: {
                minHeight: 32,
                borderRadius: 6,
                "&.Mui-selected": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                }
            }
        };
    });
