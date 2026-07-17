/* eslint-disable tss-unused-classes/unused-classes */
import { useEffect, useState, type ReactNode } from "react";
import Input from "@mui/material/Input";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { getS3ObjectIconUrl } from "ui/shared/codex/getS3ObjectIconUrl";

// eslint-disable-next-line react-refresh/only-export-components
export function useS3DialogClasses() {
    return useStyles_S3Dialog().classes;
}

export function S3DialogTextInput(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onEnterKeyDown?: () => void;
    error?: ReactNode;
    autoFocus?: boolean;
    isStrong?: boolean;
}) {
    const {
        label,
        value,
        onChange,
        onEnterKeyDown,
        error,
        autoFocus = false,
        isStrong = false
    } = props;

    const { classes, cx } = useStyles_S3DialogTextInput();

    return (
        <label className={classes.root}>
            <Text typo="label 1" className={classes.label}>
                {label}
            </Text>
            <Input
                className={cx(
                    classes.input,
                    isStrong && classes.inputStrong,
                    error !== undefined && classes.inputError
                )}
                value={value}
                autoFocus={autoFocus}
                disableUnderline={true}
                onFocus={event => event.currentTarget.select()}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => {
                    if (event.key !== "Enter") {
                        return;
                    }

                    event.preventDefault();
                    onEnterKeyDown?.();
                }}
                inputProps={{ "aria-label": label }}
            />
            {error !== undefined && (
                <Text typo="body 2" className={classes.error}>
                    {error}
                </Text>
            )}
        </label>
    );
}

export function S3DialogCopyField(props: {
    value: string | undefined;
    pendingText?: string;
    copyLabel?: string;
    ariaLabel: string;
    onCopied?: () => void;
}) {
    return <S3DialogCopyFieldBase {...props} renderValue={value => value} />;
}

export function S3DialogCopyUrlField(props: {
    value: string | undefined;
    pendingText?: string;
    copyLabel?: string;
    ariaLabel: string;
    onCopied?: () => void;
}) {
    const formattedUrl =
        props.value === undefined ? undefined : formatUrlForDisplay(props.value);
    const isStructuredPreview =
        formattedUrl !== undefined && formattedUrl.queryParams.length !== 0;

    return (
        <S3DialogCopyFieldBase
            {...props}
            isMultiline={isStructuredPreview}
            hasTitle={false}
            renderValue={value => (
                <S3DialogFormattedUrl
                    value={value}
                    formattedUrl={formattedUrl ?? formatUrlForDisplay(value)}
                />
            )}
        />
    );
}

function S3DialogCopyFieldBase(props: {
    value: string | undefined;
    pendingText?: string;
    copyLabel?: string;
    ariaLabel: string;
    onCopied?: () => void;
    renderValue: (value: string) => ReactNode;
    isMultiline?: boolean;
    hasTitle?: boolean;
}) {
    const {
        value,
        pendingText,
        copyLabel,
        ariaLabel,
        onCopied,
        renderValue,
        isMultiline = false,
        hasTitle = true
    } = props;
    const { classes, cx } = useStyles_S3DialogCopyField();
    const { t } = useTranslation({ S3DialogCopyField });
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setIsCopied(false);
    }, [value]);

    useEffect(() => {
        if (!isCopied) {
            return;
        }

        const timeoutId = window.setTimeout(() => setIsCopied(false), 1400);

        return () => window.clearTimeout(timeoutId);
    }, [isCopied]);

    const copy = async () => {
        if (value === undefined) {
            return;
        }

        await copyToClipboard(value);
        setIsCopied(true);
        onCopied?.();
    };

    return (
        <div
            className={cx(
                classes.root,
                isMultiline && classes.rootMultiline,
                isCopied && classes.rootCopied
            )}
        >
            <span
                className={cx(classes.value, isMultiline && classes.valueMultiline)}
                title={hasTitle ? value : undefined}
            >
                {value === undefined
                    ? (pendingText ?? t("generating url"))
                    : renderValue(value)}
            </span>
            <Button
                variant="secondary"
                className={cx(
                    classes.copyButton,
                    isMultiline && classes.copyButtonMultiline,
                    isCopied && classes.copyButtonCopied
                )}
                startIcon={getIconUrlByName(isCopied ? "Check" : "ContentCopy")}
                disabled={value === undefined}
                aria-label={ariaLabel}
                onClick={copy}
            >
                {isCopied ? t("copied") : (copyLabel ?? t("copy"))}
            </Button>
        </div>
    );
}

function S3DialogFormattedUrl(props: {
    value: string;
    formattedUrl: ReturnType<typeof formatUrlForDisplay>;
}) {
    const { value, formattedUrl } = props;

    const { classes } = useStyles_S3DialogCopyField();

    return (
        <a href={value} target="_blank" rel="noreferrer" className={classes.urlPreview}>
            <span className={classes.urlLine}>
                <span className={classes.urlBase}>{formattedUrl.base}</span>
            </span>
            {formattedUrl.queryParams.length !== 0 && (
                <span className={classes.urlLine}>
                    <span className={classes.urlQuestion}>?</span>
                </span>
            )}
            {formattedUrl.queryParams.map((queryParam, index) => (
                <span key={index} className={classes.urlLine}>
                    <span className={classes.urlSyntax} aria-hidden="true">
                        &amp;{" "}
                    </span>
                    <span className={classes.urlQueryParamName}>{queryParam.name}</span>
                    {queryParam.value !== undefined && (
                        <>
                            <span className={classes.urlSyntax}>=</span>
                            <span className={classes.urlQueryParamValue}>
                                {queryParam.value.map((segment, index) => (
                                    <span
                                        key={index}
                                        className={
                                            segment.isElision
                                                ? classes.urlQueryParamValueElision
                                                : undefined
                                        }
                                    >
                                        {segment.text}
                                    </span>
                                ))}
                            </span>
                        </>
                    )}
                </span>
            ))}
            {formattedUrl.hash !== undefined && (
                <span className={classes.urlLine}>
                    <span className={classes.urlBase}>{formattedUrl.hash}</span>
                </span>
            )}
        </a>
    );
}

function formatUrlForDisplay(url: string): {
    base: string;
    queryParams: {
        name: string;
        value: { text: string; isElision?: true }[] | undefined;
    }[];
    hash: string | undefined;
} {
    const queryStartIndex = url.indexOf("?");

    if (queryStartIndex === -1) {
        return {
            base: url,
            queryParams: [],
            hash: undefined
        };
    }

    const base = url.slice(0, queryStartIndex);
    const queryAndHash = url.slice(queryStartIndex + 1);
    const hashStartIndex = queryAndHash.indexOf("#");
    const query =
        hashStartIndex === -1 ? queryAndHash : queryAndHash.slice(0, hashStartIndex);
    const hash = hashStartIndex === -1 ? undefined : queryAndHash.slice(hashStartIndex);

    return {
        base,
        queryParams:
            query === ""
                ? []
                : query.split("&").map(queryParam => {
                      const valueStartIndex = queryParam.indexOf("=");

                      if (valueStartIndex === -1) {
                          return {
                              name: decodeUriComponentForDisplay(
                                  queryParam,
                                  decodeURIComponent
                              ),
                              value: undefined
                          };
                      }

                      const name = queryParam.slice(0, valueStartIndex);
                      const value = queryParam.slice(valueStartIndex + 1);

                      return {
                          name: decodeUriComponentForDisplay(name, decodeURIComponent),
                          value: getDisplayUrlQueryParamValue({
                              name,
                              value: decodeUriComponentForDisplay(
                                  value,
                                  decodeURIComponent
                              )
                          })
                      };
                  }),
        hash:
            hash === undefined ? undefined : decodeUriComponentForDisplay(hash, decodeURI)
    };
}

function getDisplayUrlQueryParamValue(params: {
    name: string;
    value: string;
}): { text: string; isElision?: true }[] {
    const { name, value } = params;

    switch (name.toLowerCase()) {
        case "x-amz-credential":
            return collapseMiddle({ value, headLength: 6, tailLength: 7 });
        case "x-amz-security-token":
            return collapseMiddle({ value, headLength: 6, tailLength: 5 });
        case "x-amz-signature":
            return collapseMiddle({ value, headLength: 6, tailLength: 5 });
        default:
            return value.length > 72
                ? collapseMiddle({ value, headLength: 24, tailLength: 16 })
                : [{ text: value }];
    }
}

function decodeUriComponentForDisplay(
    value: string,
    decode: (value: string) => string
): string {
    try {
        return decode(value);
    } catch {
        return value;
    }
}

function collapseMiddle(params: {
    value: string;
    headLength: number;
    tailLength: number;
}): { text: string; isElision?: true }[] {
    const { value, headLength, tailLength } = params;

    if (value.length <= headLength + tailLength + 1) {
        return [{ text: value }];
    }

    return [
        { text: value.slice(0, headLength) },
        { text: "\u2026", isElision: true },
        { text: value.slice(-tailLength) }
    ];
}

export function S3DialogItemSummary(props: {
    className?: string;
    name: string;
    isPublic?: boolean;
    icon?: "folder" | "object";
}) {
    const { className, name, isPublic = false, icon = "folder" } = props;

    const { classes, cx } = useStyles_S3DialogItemSummary();
    const { t } = useTranslation({ S3DialogItemSummary });

    return (
        <div className={cx(classes.root, className)}>
            <span
                className={cx(
                    classes.iconSurface,
                    icon === "folder" && classes.iconSurfaceFolder
                )}
                aria-hidden="true"
            >
                <Icon
                    icon={
                        icon === "folder"
                            ? getIconUrlByName("Folder")
                            : getS3ObjectIconUrl(name)
                    }
                    size="small"
                />
            </span>
            <Text typo="label 1" className={classes.name}>
                {name}
            </Text>
            {isPublic && (
                <span className={classes.publicPill}>
                    <Icon icon={getIconUrlByName("Public")} size="extra small" />
                    {t("public")}
                </span>
            )}
        </div>
    );
}

const useStyles_S3Dialog = tss.withName({ useS3DialogClasses }).create(({ theme }) => ({
    paper: {
        width: 650,
        maxWidth: "calc(100vw - 48px)",
        borderRadius: 12,
        padding: theme.spacing(4),
        boxSizing: "border-box"
    },

    overlayRoot: {
        "& .MuiBackdrop-root": {
            backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
            backdropFilter: "blur(1px)"
        }
    },
    title: {
        marginBottom: theme.spacing(4),
        color: theme.colors.useCases.typography.textPrimary
    },

    subtitle: {
        marginBottom: theme.spacing(4),
        color: theme.colors.useCases.typography.textPrimary,
        lineHeight: 1.5
    },

    body: {
        width: "100%",
        overflow: "visible",
        color: theme.colors.useCases.typography.textPrimary
    },

    buttons: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: theme.spacing(2),
        marginTop: theme.spacing(4),
        "& .MuiButton-root": {
            marginLeft: 0
        }
    },

    hiddenButtons: {
        display: "none"
    }
}));

const { i18n: i18nS3DialogCopyField } = declareComponentKeys<
    "generating url" | "copy" | "copied"
>()({ S3DialogCopyField });

const { i18n: i18nS3DialogItemSummary } = declareComponentKeys<"public">()({
    S3DialogItemSummary
});

export type I18n = typeof i18nS3DialogCopyField | typeof i18nS3DialogItemSummary;

const useStyles_S3DialogTextInput = tss
    .withName({ S3DialogTextInput })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            minWidth: 0
        },
        label: {
            color: theme.colors.useCases.typography.textPrimary
        },
        input: {
            minHeight: 52,
            borderRadius: 12,
            border: "2px solid transparent",
            backgroundColor: theme.colors.useCases.surfaces.background,
            color: theme.colors.useCases.typography.textPrimary,
            transition: "border-color 160ms ease, background-color 160ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                borderColor: "transparent"
            },
            "&.Mui-focused": {
                borderColor: theme.colors.useCases.typography.textFocus
            },
            "& .MuiInputBase-input": {
                ...theme.typography.variants["body 1"].style,
                padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
                color: theme.colors.useCases.typography.textPrimary,
                "&::placeholder": {
                    color: theme.colors.useCases.typography.textSecondary,
                    opacity: 1
                }
            }
        },
        inputStrong: {
            "& .MuiInputBase-input": {
                fontWeight: 700
            }
        },
        inputError: {
            borderColor: theme.colors.useCases.alertSeverity.error.main
        },
        error: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));

const useStyles_S3DialogCopyField = tss
    .withName({ S3DialogCopyField })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minWidth: 0,
            minHeight: 52,
            padding: `${theme.spacing(0.75)}px ${theme.spacing(1.5)}px ${theme.spacing(
                0.75
            )}px ${theme.spacing(2)}px`,
            borderRadius: 12,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.background,
            boxSizing: "border-box",
            transition: "background-color 180ms ease, border-color 180ms ease"
        },
        rootCopied: {
            borderColor: alpha(theme.colors.useCases.alertSeverity.success.main, 0.36),
            backgroundColor: theme.colors.useCases.alertSeverity.success.background
        },
        rootMultiline: {
            display: "block",
            position: "relative",
            minHeight: 0,
            padding: `${theme.spacing(3)}px ${theme.spacing(3)}px`
        },
        value: {
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: theme.colors.useCases.typography.textPrimary,
            ...theme.typography.variants["body 1"].style
        },
        valueMultiline: {
            display: "block",
            overflow: "visible",
            textOverflow: "clip",
            whiteSpace: "normal",
            paddingRight: 150
        },
        copyButton: {
            ...theme.typography.variants["label 2"].style,
            flex: "none",
            minHeight: 30,
            gap: 4,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 12,
            paddingRight: 12,
            "& .MuiSvgIcon-root, & svg, & img": {
                width: 16,
                height: 16,
                fontSize: 16
            }
        },
        copyButtonMultiline: {
            position: "absolute",
            top: theme.spacing(2),
            right: theme.spacing(2),
            marginTop: 0,
            "&&": {
                color: theme.colors.useCases.typography.textFocus,
                borderColor: alpha(theme.colors.useCases.typography.textFocus, 0.46),
                backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.08)
            },
            "&&:hover": {
                borderColor: alpha(theme.colors.useCases.typography.textFocus, 0.78),
                backgroundColor: alpha(theme.colors.useCases.typography.textFocus, 0.14)
            }
        },
        copyButtonCopied: {
            "&&": {
                color: theme.colors.useCases.typography.textPrimary,
                backgroundColor: theme.colors.useCases.alertSeverity.success.main,
                borderColor: theme.colors.useCases.alertSeverity.success.main,
                "&:hover": {
                    backgroundColor: theme.colors.useCases.alertSeverity.success.main
                }
            }
        },
        urlPreview: {
            display: "flex",
            flexDirection: "column",
            gap: 6,
            color: "inherit",
            textDecoration: "none",
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: 16,
            lineHeight: 1.45,
            "&:hover": {
                textDecoration: "none"
            },
            "&:focus-visible": {
                outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                outlineOffset: 2,
                borderRadius: 4
            }
        },
        urlLine: {
            display: "flex",
            alignItems: "baseline",
            minWidth: 0
        },
        urlBase: {
            minWidth: 0,
            overflowWrap: "anywhere",
            color: theme.colors.useCases.typography.textFocus
        },
        urlQuestion: {
            color: theme.colors.useCases.typography.textFocus
        },
        urlSyntax: {
            flex: "none",
            color: theme.colors.useCases.typography.textSecondary
        },
        urlQueryParamName: {
            minWidth: 0,
            overflowWrap: "anywhere",
            color: theme.colors.useCases.typography.textPrimary,
            fontWeight: 700
        },
        urlQueryParamValue: {
            minWidth: 0,
            overflowWrap: "anywhere",
            color: theme.colors.useCases.typography.textSecondary
        },
        urlQueryParamValueElision: {
            color: alpha(theme.colors.useCases.typography.textSecondary, 0.58)
        }
    }));

const useStyles_S3DialogItemSummary = tss
    .withName({ S3DialogItemSummary })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minWidth: 0,
            minHeight: 40
        },
        iconSurface: {
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        iconSurfaceFolder: {
            color: theme.colors.useCases.typography.textFocus
        },
        name: {
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: theme.colors.useCases.typography.textPrimary
        },
        publicPill: {
            ...theme.typography.variants["label 2"].style,
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(0.5),
            minHeight: 24,
            padding: `0 ${theme.spacing(1)}px`,
            borderRadius: 999,
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.12),
            flex: "none"
        }
    }));
