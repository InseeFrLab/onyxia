import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { getIconUrlByName } from "lazy-icons";
import { type ThemedAssetUrl, useResolveThemedAssetUrl } from "onyxia-ui";
import { IconButton } from "onyxia-ui/IconButton";
import { useId, useState } from "react";
import { tss } from "tss";

export function FormTextField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    isSensitive?: boolean;
    errorMessage?: string;
    onBlur?: () => void;
}) {
    const {
        label,
        value,
        onChange,
        autoComplete,
        isSensitive = false,
        errorMessage,
        onBlur
    } = props;
    const inputId = useId();
    const helperTextId = useId();
    const { classes } = useStyles();
    const [isValueVisible, setIsValueVisible] = useState(!isSensitive);

    return (
        <FormControl
            fullWidth={true}
            error={errorMessage !== undefined}
            className={classes.control}
        >
            <label htmlFor={inputId} className={classes.label}>
                {label}
            </label>
            <Input
                id={inputId}
                className={classes.input}
                value={value}
                onChange={event => onChange(event.target.value)}
                onBlur={onBlur}
                type={isValueVisible ? "text" : "password"}
                fullWidth={true}
                disableUnderline={true}
                autoComplete={autoComplete}
                inputProps={{
                    "aria-describedby":
                        errorMessage === undefined ? undefined : helperTextId
                }}
                endAdornment={
                    isSensitive && (
                        <InputAdornment position="end">
                            <IconButton
                                size="small"
                                icon={getIconUrlByName(
                                    isValueVisible ? "VisibilityOff" : "Visibility"
                                )}
                                onClick={() => setIsValueVisible(!isValueVisible)}
                            />
                        </InputAdornment>
                    )
                }
            />
            {errorMessage !== undefined && (
                <FormHelperText id={helperTextId}>{errorMessage}</FormHelperText>
            )}
        </FormControl>
    );
}

export function FormSelectField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; iconUrl?: ThemedAssetUrl }[];
}) {
    const { label, value, onChange, options } = props;
    const labelId = useId();
    const { classes, cx } = useStyles();
    const { resolveThemedAssetUrl } = useResolveThemedAssetUrl();

    return (
        <FormControl fullWidth={true} className={cx(classes.control, classes.select)}>
            <label id={labelId} className={classes.label}>
                {label}
            </label>
            <Select<string>
                value={value}
                displayEmpty={true}
                onChange={event => onChange(event.target.value)}
                labelId={labelId}
                renderValue={selectedValue => {
                    const option = options.find(option => option.value === selectedValue);

                    if (option === undefined) {
                        return selectedValue;
                    }

                    return (
                        <>
                            {option.iconUrl !== undefined && (
                                <img
                                    className={classes.optionIcon}
                                    src={resolveThemedAssetUrl(option.iconUrl)}
                                    alt=""
                                />
                            )}
                            {option.label}
                        </>
                    );
                }}
                MenuProps={{
                    slotProps: { paper: { className: classes.menu } },
                    MenuListProps: { className: classes.menuList }
                }}
            >
                {options.map(option => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                        className={classes.menuItem}
                    >
                        {option.iconUrl !== undefined && (
                            <img
                                className={classes.optionIcon}
                                src={resolveThemedAssetUrl(option.iconUrl)}
                                alt=""
                            />
                        )}
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

const useStyles = tss
    .withName({ CustomProviderFormFields: FormTextField })
    .create(({ theme }) => {
        return {
            control: {
                gap: theme.spacing(1)
            },
            label: {
                ...theme.typography.variants["label 1"].style,
                color: theme.colors.useCases.typography.textPrimary
            },
            input: {
                // NOTE: Override MUI's `label + .MuiInput-formControl` top margin
                "&&": {
                    marginTop: 0
                },
                minHeight: 45,
                paddingRight: theme.spacing(2.5),
                borderRadius: theme.spacing(2),
                border: "2px solid transparent",
                backgroundColor: theme.colors.useCases.surfaces.background,
                transition: "background-color 160ms ease, border-color 160ms ease",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                },
                "&.Mui-focused": {
                    borderColor: theme.colors.useCases.buttons.actionActive
                },
                "&.Mui-error": {
                    borderColor: theme.colors.useCases.alertSeverity.error.main
                },
                "& .MuiInputBase-input": {
                    ...theme.typography.variants["label 1"].style,
                    padding: `${theme.spacing(2)}px ${theme.spacing(2.5)}px`,
                    color: theme.colors.useCases.typography.textPrimary,
                    "&::placeholder": {
                        ...theme.typography.variants["body 1"].style,
                        color: theme.colors.useCases.typography.textSecondary,
                        opacity: 1
                    }
                }
            },
            select: {
                "& .MuiInputBase-root": {
                    minHeight: 45,
                    borderRadius: theme.spacing(2),
                    backgroundColor: theme.colors.useCases.surfaces.background,
                    color: theme.colors.useCases.typography.textPrimary,
                    transition: "background-color 160ms ease"
                },
                "& .MuiInputBase-root:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                },
                "& .MuiOutlinedInput-notchedOutline, & .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                        border: "2px solid transparent"
                    },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.colors.useCases.buttons.actionActive
                },
                "& .MuiSelect-select": {
                    ...theme.typography.variants["label 1"].style,
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(2),
                    minHeight: "unset",
                    paddingTop: theme.spacing(2),
                    paddingBottom: theme.spacing(2),
                    paddingLeft: theme.spacing(2.5),
                    paddingRight: `${theme.spacing(6)}px !important`
                },
                "& .MuiSelect-icon": {
                    color: theme.colors.useCases.typography.textPrimary,
                    right: theme.spacing(2.5)
                }
            },
            menu: {
                marginTop: theme.spacing(1),
                borderRadius: theme.spacing(2.5),
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                backgroundImage: "none"
            },
            menuList: {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                padding: theme.spacing(2)
            },
            menuItem: {
                ...theme.typography.variants["label 1"].style,
                gap: theme.spacing(2),
                padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
                borderRadius: theme.spacing(2),
                "&.Mui-selected, &.Mui-selected:hover, &.Mui-focusVisible": {
                    backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
                }
            },
            optionIcon: {
                width: theme.iconSizesInPxByName.default,
                height: theme.iconSizesInPxByName.default,
                flexShrink: 0,
                objectFit: "contain"
            }
        };
    });
