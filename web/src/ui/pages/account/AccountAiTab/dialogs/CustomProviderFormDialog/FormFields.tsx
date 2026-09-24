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
import { getFieldStyle } from "../../shared/fieldStyle";

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
        const fieldStyle = getFieldStyle({ theme });

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
                ...fieldStyle.frame,
                paddingRight: theme.spacing(2.5),
                "&:hover": fieldStyle.frame_hover,
                "&.Mui-focused": fieldStyle.frame_focused,
                "&.Mui-error": fieldStyle.frame_error,
                "& .MuiInputBase-input": {
                    ...theme.typography.variants["label 1"].style,
                    ...fieldStyle.padding,
                    height: "auto",
                    color: theme.colors.useCases.typography.textPrimary,
                    "&::placeholder": fieldStyle.placeholder
                }
            },
            select: {
                "& .MuiInputBase-root": {
                    ...fieldStyle.frame,
                    "&:hover": fieldStyle.frame_hover,
                    "&.Mui-focused": fieldStyle.frame_focused
                },
                // The frame carries the border, MUI's outline is not used
                "& .MuiOutlinedInput-notchedOutline": {
                    display: "none"
                },
                // NOTE: As specific as MUI's rule, which reserves room for the icon
                "& .MuiInputBase-root .MuiSelect-select.MuiInputBase-input": {
                    ...theme.typography.variants["label 1"].style,
                    ...fieldStyle.padding,
                    paddingRight: theme.spacing(6),
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(2),
                    minHeight: "unset"
                },
                "& .MuiSelect-icon": {
                    color: theme.colors.useCases.typography.textPrimary,
                    right: theme.spacing(2.5)
                }
            },
            menu: fieldStyle.menuPaper,
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
