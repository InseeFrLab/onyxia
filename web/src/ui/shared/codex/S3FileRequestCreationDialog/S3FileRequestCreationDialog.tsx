import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { assert, type Equals } from "tsafe/assert";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogCopyUrlField,
    S3DialogItemSummary
} from "ui/shared/codex/S3DialogPrimitives";

export type S3FileRequestCreationDialogProps = {
    className?: string;
    folderName: string;
    validityDuration: S3FileRequestCreationDialogProps.ValidityDuration;
    maxObjectSize: S3FileRequestCreationDialogProps.MaxObjectSize;
    uploadPageUrl: string | undefined;
    errorMessage: string | undefined;
    changeValidityDuration: (params: {
        validityDuration: S3FileRequestCreationDialogProps.ValidityDuration;
    }) => void;
    changeMaxObjectSize: (params: {
        maxObjectSize: S3FileRequestCreationDialogProps.MaxObjectSize;
    }) => void;
    retryGeneration: () => void;
};

export namespace S3FileRequestCreationDialogProps {
    export type ValidityDuration = "one hour" | "one day" | "one week";

    export type MaxObjectSize = "no limit" | "10 MB" | "100 MB" | "1 GB" | "5 GB";
}

const validityDurationOptions = ["one hour", "one day", "one week"] as const;
const maxObjectSizeOptions = ["no limit", "10 MB", "100 MB", "1 GB", "5 GB"] as const;

assert<
    Equals<
        (typeof validityDurationOptions)[number],
        S3FileRequestCreationDialogProps.ValidityDuration
    >
>;
assert<
    Equals<
        (typeof maxObjectSizeOptions)[number],
        S3FileRequestCreationDialogProps.MaxObjectSize
    >
>;

export function S3FileRequestCreationDialog(props: S3FileRequestCreationDialogProps) {
    const {
        className,
        folderName,
        validityDuration,
        maxObjectSize,
        uploadPageUrl,
        errorMessage,
        changeValidityDuration,
        changeMaxObjectSize,
        retryGeneration
    } = props;

    const { t } = useTranslation({ S3FileRequestCreationDialog });
    const { classes, cx } = useStyles();

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.folderSection}>
                <S3DialogItemSummary
                    className={classes.folderSummary}
                    name={folderName}
                    icon="folder"
                />
                <Text typo="body 1" className={classes.description}>
                    {t("description")}
                </Text>
            </div>

            <div className={classes.settingsSection}>
                <Text typo="label 1">{t("link settings")}</Text>
                <div className={classes.settingsGrid}>
                    <label className={classes.setting}>
                        <Text typo="body 2" className={classes.settingLabel}>
                            {t("link expires after")}
                        </Text>
                        <FormControl variant="outlined" className={classes.select}>
                            <Select
                                value={validityDuration}
                                inputProps={{
                                    "aria-label": t("link validity aria label")
                                }}
                                onChange={event => {
                                    if (!isValidityDuration(event.target.value)) {
                                        return;
                                    }

                                    changeValidityDuration({
                                        validityDuration: event.target.value
                                    });
                                }}
                            >
                                {validityDurationOptions.map(option => (
                                    <MenuItem key={option} value={option}>
                                        {formatValidityDuration(option, t)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </label>

                    <label className={classes.setting}>
                        <Text typo="body 2" className={classes.settingLabel}>
                            {t("maximum size per file")}
                        </Text>
                        <FormControl variant="outlined" className={classes.select}>
                            <Select
                                value={maxObjectSize}
                                inputProps={{
                                    "aria-label": t("maximum file size aria label")
                                }}
                                onChange={event => {
                                    if (!isMaxObjectSize(event.target.value)) {
                                        return;
                                    }

                                    changeMaxObjectSize({
                                        maxObjectSize: event.target.value
                                    });
                                }}
                            >
                                {maxObjectSizeOptions.map(option => (
                                    <MenuItem key={option} value={option}>
                                        {formatMaxObjectSize(option, t)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </label>
                </div>
            </div>

            <div className={classes.linkSection}>
                <Text typo="label 1">{t("upload link")}</Text>
                {errorMessage === undefined ? (
                    <S3DialogCopyUrlField
                        value={uploadPageUrl}
                        pendingText={t("generating upload link")}
                        ariaLabel={t("copy upload link aria label")}
                    />
                ) : (
                    <div className={classes.errorBox} role="alert">
                        <div className={classes.errorText}>
                            <Icon icon={getIconUrlByName("ErrorOutline")} size="small" />
                            <Text typo="body 2">{t("generation failed")}</Text>
                        </div>
                        <Button variant="secondary" onClick={retryGeneration}>
                            {t("retry")}
                        </Button>
                    </div>
                )}
            </div>

            <div className={classes.infoSection}>
                <Icon icon={getIconUrlByName("Info")} size="small" />
                <Text typo="body 1" className={classes.infoText}>
                    {t("security note")}
                </Text>
            </div>
        </section>
    );
}

function isValidityDuration(
    value: unknown
): value is S3FileRequestCreationDialogProps.ValidityDuration {
    return (
        typeof value === "string" &&
        (validityDurationOptions as readonly string[]).includes(value)
    );
}

function isMaxObjectSize(
    value: unknown
): value is S3FileRequestCreationDialogProps.MaxObjectSize {
    return (
        typeof value === "string" &&
        (maxObjectSizeOptions as readonly string[]).includes(value)
    );
}

function formatValidityDuration(
    validityDuration: S3FileRequestCreationDialogProps.ValidityDuration,
    t: ReturnType<typeof useTranslation>["t"]
): string {
    switch (validityDuration) {
        case "one hour":
            return t("validity duration one hour");
        case "one day":
            return t("validity duration one day");
        case "one week":
            return t("validity duration one week");
    }
}

function formatMaxObjectSize(
    maxObjectSize: S3FileRequestCreationDialogProps.MaxObjectSize,
    t: ReturnType<typeof useTranslation>["t"]
): string {
    return maxObjectSize === "no limit" ? t("no limit") : maxObjectSize;
}

const useStyles = tss.withName({ S3FileRequestCreationDialog }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
    },
    folderSection: {
        paddingBottom: theme.spacing(3),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    folderSummary: {
        minHeight: 56,
        gap: theme.spacing(2.5),
        marginBottom: theme.spacing(2.5),
        "& > :first-child": {
            width: 54,
            height: 54,
            borderRadius: 10,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.38)
        },
        "& > :nth-child(2)": {
            whiteSpace: "normal",
            fontSize: 20,
            lineHeight: 1.35,
            fontWeight: 500
        }
    },
    description: {
        color: theme.colors.useCases.typography.textSecondary,
        lineHeight: 1.55,
        maxWidth: 760
    },
    settingsSection: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    settingsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: theme.spacing(3),
        "@media (max-width: 600px)": {
            gridTemplateColumns: "minmax(0, 1fr)"
        }
    },
    setting: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        minWidth: 0
    },
    settingLabel: {
        color: theme.colors.useCases.typography.textSecondary
    },
    select: {
        minWidth: 0,
        "& .MuiInputBase-root": {
            minHeight: 54,
            borderRadius: 10,
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.18)
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.colors.useCases.surfaces.surface2
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(theme.colors.useCases.typography.textFocus, 0.72)
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.colors.useCases.typography.textFocus
        },
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "unset",
            paddingTop: theme.spacing(1.5),
            paddingBottom: theme.spacing(1.5),
            paddingLeft: theme.spacing(2),
            ...theme.typography.variants["body 1"].style
        },
        "& .MuiSelect-icon": {
            color: theme.colors.useCases.typography.textFocus
        }
    },
    linkSection: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        minWidth: 0,
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3)
    },
    errorBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: theme.spacing(2),
        borderRadius: 10,
        backgroundColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.1)
    },
    errorText: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        color: theme.colors.useCases.alertSeverity.error.main
    },
    infoSection: {
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr)",
        gap: theme.spacing(2),
        alignItems: "start",
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        color: theme.colors.useCases.typography.textFocus
    },
    infoText: {
        color: theme.colors.useCases.typography.textSecondary,
        lineHeight: 1.55,
        maxWidth: 760
    }
}));

const { i18n } = declareComponentKeys<
    | "description"
    | "link settings"
    | "link expires after"
    | "link validity aria label"
    | "maximum size per file"
    | "maximum file size aria label"
    | "upload link"
    | "generating upload link"
    | "copy upload link aria label"
    | "generation failed"
    | "retry"
    | "security note"
    | "validity duration one hour"
    | "validity duration one day"
    | "validity duration one week"
    | "no limit"
>()({ S3FileRequestCreationDialog });
export type I18n = typeof i18n;
