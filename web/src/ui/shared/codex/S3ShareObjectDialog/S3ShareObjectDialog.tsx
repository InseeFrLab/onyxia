import { useEffect, useId, useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { alpha } from "@mui/material/styles";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { assert, type Equals } from "tsafe";

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

type CopyStatus = "idle" | "copied" | "failed";

export function S3ShareObjectDialog(props: S3ShareObjectDialogProps) {
    const { className, objectBasename, httpUrl, isPublic } = props;

    const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
    const validitySelectLabelId = useId();

    const { classes, cx } = useStyles({
        isUrlAvailable: httpUrl !== undefined,
        copyStatus
    });

    useEffect(() => {
        if (copyStatus === "idle") {
            return;
        }

        const timer = setTimeout(() => setCopyStatus("idle"), 1800);

        return () => clearTimeout(timer);
    }, [copyStatus]);

    useEffect(() => {
        setCopyStatus("idle");
    }, [httpUrl]);

    const isSignedLink = isPublic !== true;

    const copyHttpUrl = async () => {
        if (httpUrl === undefined) {
            return;
        }

        try {
            await copyToClipboard(httpUrl);
            setCopyStatus("copied");
        } catch {
            setCopyStatus("failed");
        }
    };

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.header}>
                <div className={classes.objectIcon} aria-hidden="true">
                    <Icon icon={getIconUrlByName("Description")} size="small" />
                </div>
                <div className={classes.headerText}>
                    <Text
                        typo="body 2"
                        className={classes.objectBasename}
                        componentProps={{ title: objectBasename }}
                    >
                        {objectBasename}
                    </Text>
                </div>
            </div>

            <div className={classes.policyPanel}>
                <div className={classes.policyText}>
                    <Text typo="label 1" className={classes.policyTitle}>
                        {getPolicyTitle({ isPublic })}
                    </Text>
                    <Text typo="body 2" className={classes.policyDescription}>
                        {getPolicyDescription(props)}
                    </Text>
                </div>
            </div>

            {isSignedLink && (
                <FormControl variant="standard" className={classes.validitySelect}>
                    <InputLabel id={validitySelectLabelId}>
                        Signed link validity
                    </InputLabel>
                    <Select
                        labelId={validitySelectLabelId}
                        value={props.validityDuration}
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
                                {formatValidityDuration(validityDuration)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <div className={classes.urlSection}>
                <Text typo="label 1" className={classes.urlLabel}>
                    HTTP URL
                </Text>
                <div className={classes.urlRow}>
                    {httpUrl === undefined ? (
                        <span className={classes.pendingUrl}>
                            {isSignedLink
                                ? "Generating signed URL..."
                                : "Generating public URL..."}
                        </span>
                    ) : (
                        <a
                            className={classes.httpUrl}
                            href={httpUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={httpUrl}
                        >
                            {getCollapsedUrl(httpUrl)}
                        </a>
                    )}

                    <button
                        type="button"
                        className={classes.copyButton}
                        onClick={copyHttpUrl}
                        disabled={httpUrl === undefined}
                        aria-label="Copy HTTP URL to clipboard"
                    >
                        <Icon
                            className={classes.copyIcon}
                            icon={getIconUrlByName(
                                copyStatus === "copied" ? "Check" : "ContentCopy"
                            )}
                            size="extra small"
                        />
                        <span>{copyStatus === "copied" ? "Copied" : "Copy"}</span>
                    </button>
                </div>

                <span className={classes.copyFeedback} role="status" aria-live="polite">
                    {copyStatus === "copied"
                        ? "Copied to clipboard"
                        : copyStatus === "failed"
                          ? "Unable to copy"
                          : ""}
                </span>
            </div>
        </section>
    );
}

function getPolicyTitle(params: { isPublic: boolean }): string {
    const { isPublic } = params;

    if (isPublic === true) {
        return "Public object";
    }

    return "Private object";
}

function getPolicyDescription(props: S3ShareObjectDialogProps): string {
    const { isPublic } = props;

    if (isPublic === true) {
        return "Anyone with the URL can access this object. This link never expires because the object is inside a prefix that has been marked public.";
    }

    return `The HTTP URL is a signed URL that expires after ${formatValidityDuration(props.validityDuration)}. To share a URL that does not expire, make one of this object's parent prefixes (folders) public.`;
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
    validityDuration: S3ShareObjectDialogProps.ValidityDuration | undefined
): string {
    switch (validityDuration) {
        case "one hour":
            return "1 hour";
        case "one day":
            return "1 day";
        case "one week":
            return "1 week";
        case undefined:
            return "the selected duration";
    }
}

function getCollapsedUrl(url: string): string {
    const maxLength = 96;

    if (url.length <= maxLength) {
        return url;
    }

    const headLength = 58;
    const tailLength = 26;

    return `${url.slice(0, headLength)}...${url.slice(-tailLength)}`;
}

const useStyles = tss
    .withName({ S3ShareObjectDialog })
    .withParams<{ isUrlAvailable: boolean; copyStatus: CopyStatus }>()
    .create(({ theme, isUrlAvailable, copyStatus }) => ({
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            padding: theme.spacing(3),
            borderRadius: 8,
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        header: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(2),
            minWidth: 0
        },
        objectIcon: {
            width: 38,
            height: 38,
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textFocus
        },
        headerText: {
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            gap: theme.spacing(0.5)
        },
        objectBasename: {
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: theme.colors.useCases.typography.textSecondary
        },
        policyPanel: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(2),
            minWidth: 0,
            padding: `${theme.spacing(2)}px ${theme.spacing(2.5)}px`,
            borderRadius: 8,
            backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.72),
            "@media (max-width: 600px)": {
                alignItems: "stretch",
                flexDirection: "column"
            }
        },
        policyText: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(0.75),
            minWidth: 0
        },
        policyTitle: {
            color: theme.colors.useCases.typography.textPrimary
        },
        policyDescription: {
            color: theme.colors.useCases.typography.textSecondary,
            lineHeight: 1.55
        },
        validitySelect: {
            width: "min(100%, 280px)"
        },
        urlSection: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1),
            minWidth: 0,
            position: "relative"
        },
        urlLabel: {
            color: theme.colors.useCases.typography.textPrimary
        },
        urlRow: {
            display: "flex",
            alignItems: "stretch",
            gap: theme.spacing(1),
            minWidth: 0,
            "@media (max-width: 600px)": {
                flexDirection: "column"
            }
        },
        httpUrl: {
            flex: "1 1 auto",
            minWidth: 0,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
            borderRadius: 8,
            boxSizing: "border-box",
            color: theme.colors.useCases.typography.textFocus,
            backgroundColor: theme.colors.useCases.surfaces.background,
            fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 13,
            textDecoration: "none",
            "&:hover": {
                textDecoration: "underline"
            },
            "&:focus-visible": {
                outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                outlineOffset: 2
            }
        },
        pendingUrl: {
            flex: "1 1 auto",
            minWidth: 0,
            display: "block",
            padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
            borderRadius: 8,
            boxSizing: "border-box",
            color: theme.colors.useCases.typography.textSecondary,
            backgroundColor: theme.colors.useCases.surfaces.background,
            fontSize: 13
        },
        copyButton: {
            border: "none",
            margin: 0,
            padding: `${theme.spacing(1.25)}px ${theme.spacing(2.25)}px`,
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing(1),
            flex: "0 0 auto",
            minWidth: 96,
            cursor: isUrlAvailable ? "pointer" : "default",
            color:
                copyStatus === "copied"
                    ? theme.colors.useCases.alertSeverity.success.main
                    : theme.colors.useCases.typography.textPrimary,
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            transition:
                "background-color 120ms ease, color 120ms ease, opacity 120ms ease",
            font: "inherit",
            fontWeight: 500,
            "&:hover": {
                backgroundColor: isUrlAvailable
                    ? theme.colors.useCases.surfaces.surface3
                    : theme.colors.useCases.surfaces.surface2
            },
            "&:focus-visible": {
                outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                outlineOffset: 2
            },
            "&:disabled": {
                opacity: 0.55
            }
        },
        copyIcon: {
            color: "currentColor"
        },
        copyFeedback: {
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
            border: 0
        }
    }));
