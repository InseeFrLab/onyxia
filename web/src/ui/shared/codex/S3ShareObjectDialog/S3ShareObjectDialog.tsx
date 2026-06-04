import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Text } from "onyxia-ui/Text";
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
            <S3DialogItemSummary
                name={objectBasename}
                isPublic={isPublic}
                icon="object"
            />

            <Text typo="body 1" className={classes.description}>
                {getPolicyDescription(props, t)}
            </Text>

            {isPublic ? (
                <S3DialogCopyUrlField
                    value={httpUrl}
                    pendingText={t("generating public URL")}
                    ariaLabel={t("copy public URL aria label")}
                />
            ) : (
                <div className={classes.signedLinkSection}>
                    <Text typo="label 1" className={classes.signedLinkLabel}>
                        {t("signed link with time limit")}
                    </Text>
                    <FormControl variant="standard" className={classes.validitySelect}>
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
                                <MenuItem key={validityDuration} value={validityDuration}>
                                    {formatValidityDuration(validityDuration, t)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <S3DialogCopyUrlField
                        value={httpUrl}
                        pendingText={t("generating signed URL")}
                        ariaLabel={t("copy signed URL aria label")}
                    />
                </div>
            )}
        </section>
    );
}

function getPolicyDescription(
    props: S3ShareObjectDialogProps,
    t: ReturnType<typeof useTranslation>["t"]
): string {
    const { isPublic } = props;

    if (isPublic === true) {
        return t("public description");
    }

    return t("signed description");
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
        gap: theme.spacing(3),
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
    },
    description: {
        color: theme.colors.useCases.typography.textPrimary,
        lineHeight: 1.5
    },
    signedLinkSection: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        minWidth: 0
    },
    signedLinkLabel: {
        color: theme.colors.useCases.typography.textPrimary
    },
    validitySelect: {
        width: 220,
        maxWidth: "100%",
        minWidth: 0,
        "& .MuiInputBase-root": {
            minHeight: 48,
            color: theme.colors.useCases.typography.textPrimary
        },
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "unset",
            paddingTop: theme.spacing(1.5),
            paddingBottom: theme.spacing(1.5)
        }
    }
}));

const { i18n } = declareComponentKeys<
    | "generating public URL"
    | "copy public URL aria label"
    | "signed link with time limit"
    | "signed link validity aria label"
    | "generating signed URL"
    | "copy signed URL aria label"
    | "public description"
    | "signed description"
    | "validity duration one hour"
    | "validity duration one day"
    | "validity duration one week"
    | "selected duration"
>()({ S3ShareObjectDialog });
export type I18n = typeof i18n;
