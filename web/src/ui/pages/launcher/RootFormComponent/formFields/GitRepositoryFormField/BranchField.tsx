import { useId } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Input from "@mui/material/Input";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { useTranslation } from "ui/i18n";
import type { FieldView } from "core/usecases/gitRepositoryFieldUiController";
import { FieldLabel } from "./ProviderLabels";
import { tss } from "tss";
import { getSharedStyles } from "./sharedStyles";
import { getFieldStyle } from "ui/shared/fieldStyle";

/** Suggested by the provider of the repository, or typed */
export function BranchField(props: {
    branch: FieldView["branch"];
    value: string;
    onChange: (branch: string) => void;
    /** "" when the list opens: every branch, then what is typed */
    onSearchChange: (search: string) => void;
}) {
    const { branch, value, onChange, onSearchChange } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation("GitRepositoryFormField");
    const branchInputId = useId();

    return (
        <div className={classes.section}>
            <div className={classes.branchRow}>
                <div
                    className={cx(
                        classes.field,
                        classes.branch,
                        branch.isRepositoryMissing && classes.branch_disabled
                    )}
                >
                    <FieldLabel htmlFor={branchInputId}>{t("branch")}</FieldLabel>
                    <Autocomplete<string, false, false, true>
                        freeSolo={true}
                        disabled={branch.isDisabled}
                        options={branch.branches}
                        // NOTE: The provider already filters on the search.
                        filterOptions={options => options}
                        loading={branch.isLoading}
                        // NOTE: The branch is marked in the list when it is one of them.
                        value={value === "" ? null : value}
                        onChange={(_event, branch) => onChange(branch ?? "")}
                        inputValue={value}
                        onInputChange={(_event, inputValue, reason) => {
                            if (reason === "input") {
                                onSearchChange(inputValue);
                            }

                            onChange(inputValue);
                        }}
                        onOpen={() => onSearchChange("")}
                        openOnFocus={true}
                        noOptionsText={t("no branch found")}
                        slotProps={{ paper: { className: classes.branchMenu } }}
                        renderInput={params => (
                            // NOTE: Like a select: a click anywhere opens the list.
                            <div
                                ref={params.InputProps.ref}
                                onMouseDown={params.InputProps.onMouseDown}
                            >
                                <Input
                                    inputProps={params.inputProps}
                                    id={branchInputId}
                                    className={classes.filledInput}
                                    disableUnderline={true}
                                    fullWidth={true}
                                    placeholder={t("select a branch")}
                                    endAdornment={
                                        branch.isLoading ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <Icon
                                                className={classes.branchArrow}
                                                icon={getIconUrlByName("ArrowDropDown")}
                                                size="default"
                                            />
                                        )
                                    }
                                />
                            </div>
                        )}
                    />
                    <Text typo="body 2" className={classes.helperText}>
                        {t("optional")}
                    </Text>
                </div>
            </div>
            {branch.isNoSuggestion && (
                <Text typo="caption" color="secondary">
                    {t("no branch suggestion")}
                </Text>
            )}
        </div>
    );
}

/** Figma's Modal/ModelList: the branches shown at once, the others are scrolled to */
const BRANCHES_VISIBLE_MAX = 5;
const BRANCH_ROW_HEIGHT_PX = 32;

const useStyles = tss.withName("BranchField").create(({ theme }) => {
    const { field, filledInput, section } = getSharedStyles({ theme });

    return {
        field,
        filledInput,
        section,
        branch: {
            minWidth: 0
        },
        branchArrow: {
            flexShrink: 0,
            pointerEvents: "none",
            color: theme.colors.useCases.typography.textPrimary
        },
        branchMenu: {
            marginTop: theme.spacing(1),
            borderRadius: theme.spacing(3),
            boxShadow: theme.shadows[2],
            // NOTE: "&&": above MUI's own rules, which the app injects after these.
            "&& .MuiAutocomplete-listbox": {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                padding: theme.spacing(2),
                boxSizing: "border-box",
                // NOTE: Exactly BRANCHES_VISIBLE_MAX rows: the padding, the rows, the gaps.
                maxHeight:
                    2 * theme.spacing(2) +
                    BRANCHES_VISIBLE_MAX * BRANCH_ROW_HEIGHT_PX +
                    (BRANCHES_VISIBLE_MAX - 1) * theme.spacing(1),
                overflowY: "auto"
            },
            "&& .MuiAutocomplete-option": {
                ...theme.typography.variants["label 1"].style,
                boxSizing: "border-box",
                flexShrink: 0,
                minHeight: "auto",
                height: BRANCH_ROW_HEIGHT_PX,
                padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
                borderRadius: theme.spacing(2),
                ...getFieldStyle({ theme }).option
            }
        },
        branchRow: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            alignItems: "flex-end",
            columnGap: "10px",
            rowGap: theme.spacing(3)
        },
        branch_disabled: {
            opacity: 0.3
        },
        helperText: {
            color: theme.colors.useCases.typography.textTertiary
        }
    };
});
