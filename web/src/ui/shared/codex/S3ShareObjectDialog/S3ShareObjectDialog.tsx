import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { alpha } from "@mui/material/styles";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { assert, type Equals } from "tsafe";
import {
    S3DialogCopyUrlField,
    S3DialogItemSummary
} from "ui/shared/codex/S3DialogPrimitives";

export type S3ShareObjectDialogProps =
    | S3ShareObjectDialogProps.Public
    | S3ShareObjectDialogProps.Private;

export namespace S3ShareObjectDialogProps {
    export type ValidityDuration = "one hour" | "one day" | "one week";

    type Common = {
        className?: string;
        objectBasename: string;
        httpUrl: string | undefined;
    };

    export type Public = Common & {
        isPublic: true;
    };

    export type Private = Common & {
        isPublic: false;
        validityDuration: ValidityDuration;
        changeValidityDuration: (params: { validityDuration: ValidityDuration }) => void;
    };
}

const validityDurationOptions = ["one hour", "one day", "one week"] as const;

assert<
    Equals<
        (typeof validityDurationOptions)[number],
        S3ShareObjectDialogProps.ValidityDuration
    >
>;

export function S3ShareObjectDialog(props: S3ShareObjectDialogProps) {
    const { className, objectBasename, httpUrl, isPublic } = props;

    const { t } = useTranslation({ S3ShareObjectDialog });
    const { classes, cx } = useStyles();

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.objectSection}>
                <S3DialogItemSummary
                    className={classes.objectSummary}
                    name={objectBasename}
                    isPublic={isPublic}
                    icon="object"
                />
            </div>

            {isPublic ? (
                <div className={classes.linkSection}>
                    <S3DialogCopyUrlField
                        value={httpUrl}
                        pendingText={t("generating public URL")}
                        ariaLabel={t("copy public URL aria label")}
                    />
                </div>
            ) : (
                <div className={classes.linkSection}>
                    <div className={classes.linkHeader}>
                        <Text typo="label 1">
                            {t("signed URL with limited validity period")}
                        </Text>
                        <FormControl
                            variant="outlined"
                            className={classes.validitySelect}
                        >
                            <Select
                                value={props.validityDuration}
                                inputProps={{
                                    "aria-label": t("signed link validity aria label")
                                }}
                                onChange={event => {
                                    const { value } = event.target;

                                    if (!isValidityDuration(value)) {
                                        return;
                                    }

                                    props.changeValidityDuration({
                                        validityDuration: value
                                    });
                                }}
                            >
                                {validityDurationOptions.map(validityDuration => (
                                    <MenuItem
                                        key={validityDuration}
                                        value={validityDuration}
                                    >
                                        {formatValidityDuration(validityDuration, t)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                    <S3DialogCopyUrlField
                        value={httpUrl}
                        pendingText={t("generating signed URL")}
                        ariaLabel={t("copy signed URL aria label")}
                    />
                </div>
            )}

            <div className={classes.infoSection}>
                <Icon icon={getIconUrlByName("Info")} size="small" />
                <Text typo="body 1" className={classes.infoText}>
                    {isPublic
                        ? t("public sharing note")
                        : t("signed URL expiration note")}
                </Text>
            </div>
        </section>
    );
}

function isValidityDuration(
    value: unknown
): value is S3ShareObjectDialogProps.ValidityDuration {
    return (
        typeof value === "string" &&
        (validityDurationOptions as readonly string[]).includes(value)
    );
}

function formatValidityDuration(
    validityDuration: S3ShareObjectDialogProps.ValidityDuration | undefined,
    t: ReturnType<typeof useTranslation>["t"]
): string {
    switch (validityDuration) {
        case "one hour":
            return t("validity duration one hour");
        case "one day":
            return t("validity duration one day");
        case "one week":
            return t("validity duration one week");
        case undefined:
            return t("selected duration");
    }
}

const useStyles = tss.withName({ S3ShareObjectDialog }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        //width: "100%",
        //minWidth: 0,
        boxSizing: "border-box"
    },
    objectSection: {
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    objectSummary: {
        minHeight: 56,
        gap: theme.spacing(2.5),
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
        },
        marginBottom: theme.spacing(3)
    },
    linkSection: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        minWidth: 0,
        ...theme.spacing.topBottom("padding", 3)
    },
    linkHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3),
        minWidth: 0,
        "@media (max-width: 600px)": {
            alignItems: "stretch",
            flexDirection: "column",
            gap: theme.spacing(2)
        }
    },
    validitySelect: {
        width: 170,
        maxWidth: "100%",
        flex: "none",
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
        maxWidth: 720
    }
}));

const { i18n } = declareComponentKeys<
    | "generating public URL"
    | "copy public URL aria label"
    | "signed URL with limited validity period"
    | "signed link validity aria label"
    | "generating signed URL"
    | "copy signed URL aria label"
    | "public sharing note"
    | "signed URL expiration note"
    | "validity duration one hour"
    | "validity duration one day"
    | "validity duration one week"
    | "selected duration"
>()({ S3ShareObjectDialog });
export type I18n = typeof i18n;
