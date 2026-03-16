import { useEffect, useRef, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { TextField } from "onyxia-ui/TextField";
import Switch from "@mui/material/Switch";
import { tss } from "tss";

export type CreateS3ProfileModalProps = {
    className?: string;
    open: boolean;
    onClose: () => void;
    onSubmit: (params: {
        profileName: string;
        serviceUrl: string;
        region: string | undefined;
        urlStyle: "path" | "virtualHosted";
        anonymousAccess: boolean;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        sessionToken: string | undefined;
    }) => void;
    defaultValue?: {
        profileName?: string;
        serviceUrl?: string;
        region?: string;
        urlStyle?: "path" | "virtualHosted";
        anonymousAccess?: boolean;
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
    };
    isSubmitting?: boolean;
};

const steps = [
    "Custom S3 configuration",
    "Advanced configuration",
    "Account credentials"
] as const;

type DraftState = {
    profileName: string;
    serviceUrl: string;
    region: string;
    urlStyle: "path" | "virtualHosted";
    anonymousAccess: boolean;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
};

function getInitialDraft(
    defaultValue?: CreateS3ProfileModalProps["defaultValue"]
): DraftState {
    return {
        profileName: defaultValue?.profileName ?? "",
        serviceUrl: defaultValue?.serviceUrl ?? "",
        region: defaultValue?.region ?? "",
        urlStyle: defaultValue?.urlStyle ?? "virtualHosted",
        anonymousAccess: defaultValue?.anonymousAccess ?? true,
        accessKeyId: defaultValue?.accessKeyId ?? "",
        secretAccessKey: defaultValue?.secretAccessKey ?? "",
        sessionToken: defaultValue?.sessionToken ?? ""
    };
}

export function CreateS3ProfileModal(props: CreateS3ProfileModalProps) {
    const { className, open, onClose, onSubmit, defaultValue, isSubmitting } = props;
    const { classes, cx } = useStyles();
    const [stepIndex, setStepIndex] = useState(0);
    const [draft, setDraft] = useState<DraftState>(() => getInitialDraft(defaultValue));
    const wasOpenRef = useRef(open);

    useEffect(() => {
        if (open && !wasOpenRef.current) {
            setStepIndex(0);
            setDraft(getInitialDraft(defaultValue));
        }

        wasOpenRef.current = open;
    }, [open, defaultValue]);

    const updateDraft = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
        setDraft(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = () => {
        onSubmit({
            profileName: draft.profileName,
            serviceUrl: draft.serviceUrl,
            region: draft.region === "" ? undefined : draft.region,
            urlStyle: draft.urlStyle,
            anonymousAccess: draft.anonymousAccess,
            accessKeyId: draft.accessKeyId === "" ? undefined : draft.accessKeyId,
            secretAccessKey:
                draft.secretAccessKey === "" ? undefined : draft.secretAccessKey,
            sessionToken: draft.sessionToken === "" ? undefined : draft.sessionToken
        });
    };

    const stepTitle = steps[stepIndex];

    const body = (
        <div className={classes.body}>
            <div className={classes.stepHeader}>
                <div className={classes.stepHeaderText}>
                    <span className={classes.stepCounter}>
                        {`Step ${stepIndex + 1} of 3`}
                    </span>
                    <span className={classes.stepTitle}>{stepTitle}</span>
                </div>
                <div className={classes.progress} aria-hidden="true">
                    {steps.map((_, index) => (
                        <span
                            key={index}
                            className={cx(
                                classes.progressSegment,
                                index <= stepIndex && classes.progressSegmentActive
                            )}
                        />
                    ))}
                </div>
            </div>

            {stepIndex === 0 && (
                <div className={classes.stepContent}>
                    <TextField
                        label="Profil Name"
                        defaultValue={draft.profileName}
                        onValueBeingTypedChange={({ value }) =>
                            updateDraft("profileName", value)
                        }
                    />
                    <TextField
                        label="URL"
                        defaultValue={draft.serviceUrl}
                        onValueBeingTypedChange={({ value }) =>
                            updateDraft("serviceUrl", value)
                        }
                    />
                    <TextField
                        label="AWS S3 Region"
                        helperText="Example: eu-west-1, if not sure, leave empty"
                        defaultValue={draft.region}
                        onValueBeingTypedChange={({ value }) =>
                            updateDraft("region", value)
                        }
                    />
                </div>
            )}

            {stepIndex === 1 && (
                <div className={classes.stepContent}>
                    <div
                        className={classes.radioGroup}
                        role="radiogroup"
                        aria-label="URL style"
                    >
                        <div className={classes.radioHeader}>
                            <span className={classes.radioGroupLabel}>URL style</span>
                            <span className={classes.radioGroupHelper}>
                                Specify how your S3 server formats the URL for downloading
                                files.
                            </span>
                        </div>
                        <div className={classes.radioOptions}>
                            {(
                                [
                                    {
                                        value: "path" as const,
                                        label: "Path style",
                                        example: "https://s3.example.com/bucket/key"
                                    },
                                    {
                                        value: "virtualHosted" as const,
                                        label: "Virtual-hosted style",
                                        example: "https://bucket.s3.example.com/key"
                                    }
                                ] as const
                            ).map(option => {
                                const isSelected = draft.urlStyle === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        className={cx(
                                            classes.radioCard,
                                            isSelected && classes.radioCardSelected
                                        )}
                                        onClick={() =>
                                            updateDraft("urlStyle", option.value)
                                        }
                                    >
                                        <span
                                            className={cx(
                                                classes.radioIndicator,
                                                isSelected &&
                                                    classes.radioIndicatorSelected
                                            )}
                                            aria-hidden="true"
                                        >
                                            <span
                                                className={cx(
                                                    classes.radioIndicatorDot,
                                                    isSelected &&
                                                        classes.radioIndicatorDotSelected
                                                )}
                                            />
                                        </span>
                                        <span className={classes.radioText}>
                                            <span className={classes.radioOptionLabel}>
                                                {option.label}
                                            </span>
                                            <span className={classes.radioOptionExample}>
                                                {option.example}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {stepIndex === 2 && (
                <div className={classes.stepContentTight}>
                    <div className={classes.toggleRow}>
                        <span className={classes.toggleLabel}>Anonymous access</span>
                        <Switch
                            checked={draft.anonymousAccess}
                            inputProps={{ "aria-label": "Anonymous access" }}
                            onChange={(_, checked) => {
                                updateDraft("anonymousAccess", checked);
                            }}
                        />
                    </div>
                    {!draft.anonymousAccess && (
                        <div className={classes.credentialsFields}>
                            <TextField
                                label="Access Key ID"
                                helperText="Example: 1A2B3C4D5E6F7G8H9I0J"
                                defaultValue={draft.accessKeyId}
                                onValueBeingTypedChange={({ value }) =>
                                    updateDraft("accessKeyId", value)
                                }
                            />
                            <TextField
                                label="Secret Access Key"
                                type="sensitive"
                                defaultValue={draft.secretAccessKey}
                                onValueBeingTypedChange={({ value }) =>
                                    updateDraft("secretAccessKey", value)
                                }
                            />
                            <TextField
                                label="Session Token"
                                helperText="Optional"
                                type="sensitive"
                                defaultValue={draft.sessionToken}
                                onValueBeingTypedChange={({ value }) =>
                                    updateDraft("sessionToken", value)
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const footer = (
        <div className={classes.footer}>
            <Button
                variant="secondary"
                onClick={() => {
                    if (stepIndex === 0) {
                        onClose();
                        return;
                    }

                    setStepIndex(index => Math.max(index - 1, 0));
                }}
            >
                {stepIndex === 0 ? "Cancel" : "Previous"}
            </Button>
            {stepIndex < steps.length - 1 ? (
                <Button onClick={() => setStepIndex(index => index + 1)}>Next</Button>
            ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting === true}>
                    Create New S3 Profile
                </Button>
            )}
        </div>
    );

    return (
        <Dialog
            className={cx(classes.dialog, className)}
            isOpen={open}
            onClose={onClose}
            body={open ? body : undefined}
            buttons={footer}
            classes={{
                buttons: classes.dialogButtons
            }}
        />
    );
}

const useStyles = tss.withName({ CreateS3ProfileModal }).create(({ theme }) => {
    const stepCounterStyle = theme.typography.variants["body 1"].style;
    const stepTitleStyle = theme.typography.variants["section heading"].style;
    const body1Style = theme.typography.variants["body 1"].style;
    const captionStyle = theme.typography.variants["caption"].style;
    const surfaces = theme.colors.useCases.surfaces as {
        background: string;
        surface1: string;
        surface2: string;
        surfaceFocus1?: string;
    };
    const actionActive =
        (theme.colors.palette as { actionActive?: string }).actionActive ??
        theme.colors.useCases.buttons.actionActive;
    const radioHoverSurface = surfaces.surfaceFocus1 ?? surfaces.surface2;

    return {
        dialog: {
            backgroundColor: surfaces.surface1,
            width: "min(637px, calc(100vw - 48px))",
            maxWidth: "calc(100vw - 48px)",
            minHeight: "min(517px, calc(100vh - 96px))",
            padding: 32,
            borderRadius: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column"
        },
        dialogButtons: {
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: "auto",
            gap: theme.spacing(2),
            "& .MuiButton-root": {
                marginLeft: 0
            }
        },
        body: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(4)
        },
        stepHeader: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2)
        },
        stepHeaderText: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1)
        },
        stepCounter: {
            ...stepCounterStyle,
            color: theme.colors.useCases.typography.textSecondary
        },
        stepTitle: {
            ...stepTitleStyle,
            color: theme.colors.useCases.typography.textPrimary
        },
        progress: {
            display: "flex",
            gap: theme.spacing(1)
        },
        progressSegment: {
            flex: 1,
            height: 6,
            borderRadius: 999,
            backgroundColor: surfaces.surface2
        },
        progressSegmentActive: {
            backgroundColor: actionActive
        },
        stepContent: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(4)
        },
        stepContentTight: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2)
        },
        radioGroup: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3)
        },
        radioHeader: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1)
        },
        radioGroupLabel: {
            ...body1Style,
            color: theme.colors.useCases.typography.textPrimary
        },
        radioGroupHelper: {
            ...captionStyle,
            color: theme.colors.useCases.typography.textSecondary
        },
        radioOptions: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2)
        },
        radioCard: {
            border: "2px solid transparent",
            borderRadius: 12,
            padding: theme.spacing(4),
            display: "flex",
            alignItems: "flex-start",
            gap: theme.spacing(4),
            backgroundColor: surfaces.background,
            cursor: "pointer",
            textAlign: "left",
            transition: "background-color 120ms ease, border-color 120ms ease",
            color: theme.colors.useCases.typography.textPrimary,
            "&:hover": {
                backgroundColor: radioHoverSurface
            }
        },
        radioCardSelected: {
            backgroundColor: surfaces.surface1,
            borderColor: actionActive
        },
        radioIndicator: {
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `2px solid ${theme.colors.useCases.typography.textSecondary}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
        },
        radioIndicatorSelected: {
            borderColor: actionActive
        },
        radioIndicatorDot: {
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "transparent"
        },
        radioIndicatorDotSelected: {
            backgroundColor: actionActive
        },
        radioText: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1)
        },
        radioOptionLabel: {
            ...body1Style,
            fontWeight: 600,
            color: theme.colors.useCases.typography.textPrimary
        },
        radioOptionExample: {
            ...captionStyle,
            color: theme.colors.useCases.typography.textSecondary
        },
        toggleRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(2)
        },
        toggleLabel: {
            ...body1Style,
            color: theme.colors.useCases.typography.textPrimary
        },
        credentialsFields: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(6)
        },
        footer: {
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            width: "100%",
            gap: theme.spacing(2)
        }
    };
});
