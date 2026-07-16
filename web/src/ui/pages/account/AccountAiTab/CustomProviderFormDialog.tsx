import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { alpha } from "@mui/material/styles";
import type { NonPostableEvt, UnpackEvt } from "evt";
import { useEvt } from "evt/hooks";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Text } from "onyxia-ui/Text";
import { useConstCallback } from "powerhooks/useConstCallback";
import {
    memo,
    useEffect,
    useId,
    useRef,
    useState,
    type MouseEvent,
    type ReactNode
} from "react";
import { assert } from "tsafe/assert";
import { keyframes } from "tss-react";
import { getCoreSync } from "core";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";

type AiModel = { id: string; name: string };

export type Props = {
    evtOpen: NonPostableEvt<{
        editedProvider:
            | {
                  id: string;
                  name: string;
                  provider: string;
                  apiBase: string;
                  apiKey: string;
                  availableModels: AiModel[] | undefined;
                  selectedModelId: string | undefined;
                  isDefault: boolean;
              }
            | undefined;
    }>;
};

type OpenParams = UnpackEvt<Props["evtOpen"]>;

type FormValues = {
    name: string;
    provider: string;
    apiBase: string;
    apiKey: string;
    selectedModelId: string;
};

const providerProtocolDefaultApiBase = {
    openai: "https://api.openai.com/v1",
    "openai-compatible": "",
    mistral: "https://api.mistral.ai/v1",
    anthropic: "https://api.anthropic.com/v1"
} as const;

type ProviderProtocol = keyof typeof providerProtocolDefaultApiBase;

type FormTest =
    | { stateDescription: "idle" }
    | { stateDescription: "testing" }
    | { stateDescription: "success"; models: AiModel[] }
    | { stateDescription: "error" };

const defaultFormValues: FormValues = {
    name: "",
    provider: "",
    apiBase: "",
    apiKey: "",
    selectedModelId: ""
};

export const CustomProviderFormDialog = memo((props: Props) => {
    const { evtOpen } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ CustomProviderFormDialog });

    const [openState, setOpenState] = useState<
        | {
              editedProviderId: string | undefined;
              isAlreadyDefault: boolean;
          }
        | undefined
    >(undefined);
    const [values, setValues] = useState<FormValues>(defaultFormValues);
    const [test, setTest] = useState<FormTest>({ stateDescription: "idle" });
    const [doSetAsDefault, setDoSetAsDefault] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const testRequestIdRef = useRef(0);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, ({ editedProvider }: OpenParams) => {
                testRequestIdRef.current++;

                if (editedProvider === undefined) {
                    setValues(defaultFormValues);
                    setTest({ stateDescription: "idle" });
                    setDoSetAsDefault(false);
                    setOpenState({
                        editedProviderId: undefined,
                        isAlreadyDefault: false
                    });
                } else {
                    const selectedModelId =
                        editedProvider.availableModels?.some(
                            model => model.id === editedProvider.selectedModelId
                        ) === true
                            ? editedProvider.selectedModelId
                            : undefined;

                    setValues({
                        name: editedProvider.name,
                        provider: editedProvider.provider,
                        apiBase: editedProvider.apiBase,
                        apiKey: editedProvider.apiKey,
                        selectedModelId: selectedModelId ?? ""
                    });
                    setTest(
                        editedProvider.availableModels === undefined
                            ? { stateDescription: "idle" }
                            : {
                                  stateDescription: "success",
                                  models: editedProvider.availableModels
                              }
                    );
                    setDoSetAsDefault(editedProvider.isDefault);
                    setOpenState({
                        editedProviderId: editedProvider.id,
                        isAlreadyDefault: editedProvider.isDefault
                    });
                }

                setIsSaving(false);
            });
        },
        [evtOpen]
    );

    const isEditing = openState?.editedProviderId !== undefined;
    const testedModels = test.stateDescription === "success" ? test.models : undefined;
    const canSave =
        values.name.trim() !== "" &&
        values.provider !== "" &&
        values.apiBase.trim() !== "" &&
        values.apiKey.trim() !== "" &&
        values.selectedModelId !== "" &&
        testedModels?.some(model => model.id === values.selectedModelId) === true &&
        !isSaving;
    const canTest =
        values.provider !== "" &&
        values.apiBase.trim() !== "" &&
        values.apiKey.trim() !== "" &&
        !isSaving;

    const onClose = useConstCallback(() => {
        testRequestIdRef.current++;
        setOpenState(undefined);
    });

    const onFieldChange = useConstCallback((key: keyof FormValues, value: string) => {
        setValues(values => ({ ...values, [key]: value }));

        if (key === "apiBase" || key === "apiKey") {
            testRequestIdRef.current++;
            setValues(values => ({ ...values, selectedModelId: "" }));
            setTest({ stateDescription: "idle" });
        }
    });

    const onProviderChange = useConstCallback((provider: ProviderProtocol) => {
        testRequestIdRef.current++;
        setValues(values => {
            const apiBase = values.apiBase.trim();
            const isUsingProviderDefaultApiBase = Object.values(
                providerProtocolDefaultApiBase
            ).some(defaultApiBase => defaultApiBase === apiBase);

            return {
                ...values,
                provider,
                apiBase:
                    apiBase === "" || isUsingProviderDefaultApiBase
                        ? providerProtocolDefaultApiBase[provider]
                        : values.apiBase,
                selectedModelId: ""
            };
        });
        setTest({ stateDescription: "idle" });
    });

    const onTest = useConstCallback(async () => {
        if (!canTest || test.stateDescription === "testing") {
            return;
        }

        const {
            functions: { ai }
        } = getCoreSync();

        const testRequestId = ++testRequestIdRef.current;
        setTest({ stateDescription: "testing" });

        try {
            const { models } = await ai.testCustomProviderConnection({
                provider: values.provider,
                apiBase: values.apiBase,
                apiKey: values.apiKey
            });

            if (testRequestId !== testRequestIdRef.current) {
                return;
            }

            setValues(values => ({
                ...values,
                selectedModelId: models.some(model => model.id === values.selectedModelId)
                    ? values.selectedModelId
                    : ""
            }));
            setTest({ stateDescription: "success", models });
        } catch {
            if (testRequestId !== testRequestIdRef.current) {
                return;
            }

            setValues(values => ({ ...values, selectedModelId: "" }));
            setTest({ stateDescription: "error" });
        }
    });

    const onSave = useConstCallback(async () => {
        assert(openState !== undefined);
        assert(test.stateDescription === "success");
        assert(values.selectedModelId !== "");

        const {
            functions: { ai }
        } = getCoreSync();

        setIsSaving(true);

        const params = {
            name: values.name.trim(),
            provider: values.provider,
            apiBase: values.apiBase.trim(),
            apiKey: values.apiKey.trim(),
            models: test.models,
            selectedModelId: values.selectedModelId,
            doSetAsDefault
        };

        try {
            if (openState.editedProviderId === undefined) {
                await ai.addCustomProvider(params);
            } else {
                await ai.editCustomProvider({
                    providerId: openState.editedProviderId,
                    ...params
                });
            }

            onClose();
        } catch {
            setIsSaving(false);
        }
    });

    if (openState === undefined) {
        return null;
    }

    return (
        <SideDialog
            title={t(
                isEditing ? "edit custom provider title" : "add custom provider title"
            )}
            onClose={onClose}
        >
            <form
                className={classes.root}
                onSubmit={event => {
                    event.preventDefault();

                    if (!canSave) {
                        return;
                    }

                    void onSave();
                }}
                noValidate={true}
            >
                <div className={classes.body}>
                    <section className={classes.section}>
                        <SectionHeading
                            title={t("custom provider section title")}
                            subtitle={t("custom provider section subtitle")}
                        />

                        <div className={classes.fields}>
                            <FormTextField
                                label={t("custom provider label field")}
                                value={values.name}
                                onChange={value => onFieldChange("name", value)}
                                autoComplete="off"
                            />
                            <FormSelectField
                                label={t("custom provider type field")}
                                value={values.provider}
                                onChange={value =>
                                    onProviderChange(value as ProviderProtocol)
                                }
                                options={[
                                    {
                                        value: "openai",
                                        label: t("openai provider option")
                                    },
                                    {
                                        value: "openai-compatible",
                                        label: t("openai compatible provider option")
                                    },
                                    {
                                        value: "mistral",
                                        label: t("mistral provider option")
                                    },
                                    {
                                        value: "anthropic",
                                        label: t("anthropic provider option")
                                    }
                                ]}
                            />
                        </div>
                    </section>

                    <section className={classes.section}>
                        <SectionHeading
                            title={t("credentials section title")}
                            subtitle={t("credentials section subtitle")}
                        />

                        <div className={classes.fields}>
                            <FormTextField
                                label={t("custom provider api base field")}
                                value={values.apiBase}
                                onChange={value => onFieldChange("apiBase", value)}
                                autoComplete="url"
                            />
                            <FormTextField
                                label={t("custom provider api key field")}
                                value={values.apiKey}
                                onChange={value => onFieldChange("apiKey", value)}
                                autoComplete="off"
                                isSensitive={true}
                            />
                        </div>
                    </section>

                    <section className={classes.section}>
                        <div className={classes.verificationHeadingRow}>
                            <SectionHeading
                                title={t("verification section title")}
                                subtitle={t("verification section subtitle")}
                            />
                            <Button
                                variant="secondary"
                                className={classes.testButton}
                                startIcon={getIconUrlByName("SatelliteAlt")}
                                disabled={!canTest}
                                onClick={() => void onTest()}
                            >
                                {t("provider test")}
                            </Button>
                        </div>

                        <ModelSelectField
                            label={t("custom provider model field")}
                            value={values.selectedModelId}
                            onChange={value => onFieldChange("selectedModelId", value)}
                            models={testedModels ?? []}
                            disabled={testedModels === undefined}
                        />

                        {test.stateDescription === "testing" && (
                            <div className={classes.testingMessage} role="status">
                                <CircularProgress size={16} />
                                <Text typo="body 2">{t("provider testing")}</Text>
                            </div>
                        )}

                        {test.stateDescription === "success" && (
                            <StatusMessage severity="success">
                                {t("provider test success")}
                            </StatusMessage>
                        )}

                        {test.stateDescription === "error" && (
                            <StatusMessage severity="error">
                                {t("provider test error")}
                            </StatusMessage>
                        )}
                    </section>
                </div>

                <div className={classes.footer}>
                    <label className={classes.defaultProviderControl}>
                        <Checkbox
                            className={classes.checkbox}
                            checked={doSetAsDefault}
                            disabled={openState.isAlreadyDefault}
                            onChange={event => setDoSetAsDefault(event.target.checked)}
                            size="small"
                        />
                        <Text typo="body 2">{t("set as default provider")}</Text>
                    </label>

                    <div className={classes.actions}>
                        <Button
                            variant="secondary"
                            className={classes.cancelButton}
                            onClick={onClose}
                        >
                            {t("provider cancel")}
                        </Button>
                        <Button
                            type="submit"
                            className={classes.submitButton}
                            disabled={!canSave}
                        >
                            {t(isEditing ? "provider update" : "provider save")}
                        </Button>
                    </div>
                </div>
            </form>
        </SideDialog>
    );
});

function SideDialog(props: {
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    const { children, title, onClose } = props;

    const { classes } = useStyles_SideDialog();
    const { t } = useTranslation({ CustomProviderFormDialog });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const onRootClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={classes.root} onClick={onRootClick}>
            <div
                className={classes.panel}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === "string" ? title : undefined}
            >
                <div className={classes.headingWrapper}>
                    <Text typo="section heading" className={classes.title}>
                        {title}
                    </Text>
                    <IconButton
                        className={classes.closeButton}
                        size="small"
                        icon={getIconUrlByName("Close")}
                        aria-label={t("close aria label")}
                        onClick={onClose}
                    />
                </div>

                <div className={classes.childrenWrapper}>{children}</div>
            </div>
        </div>
    );
}

function SectionHeading(props: { title: string; subtitle: string }) {
    const { title, subtitle } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo="object heading" className={classes.title}>
                {title}
            </Text>
            <Text typo="body 2" className={classes.subtitle}>
                {subtitle}
            </Text>
        </div>
    );
}

function FormTextField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    isSensitive?: boolean;
}) {
    const { label, value, onChange, autoComplete, isSensitive = false } = props;
    const inputId = useId();
    const { classes } = useStyles_FormField();

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

function FormSelectField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    const { label, value, onChange, options } = props;
    const { classes } = useStyles_FormField();

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

function ModelSelectField(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    models: AiModel[];
    disabled: boolean;
}) {
    const { label, value, onChange, models, disabled } = props;
    const { classes } = useStyles_FormField();

    const renderModel = (model: AiModel) => (
        <span className={classes.modelOption}>
            <Icon
                icon={getIconUrlByName("AutoAwesome")}
                size="small"
                className={classes.modelIcon}
            />
            <span>{model.name}</span>
        </span>
    );

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

                    return model === undefined ? selectedValue : renderModel(model);
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
                        {renderModel(model)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function StatusMessage(props: { severity: "success" | "error"; children: ReactNode }) {
    const { severity, children } = props;
    const { classes, cx } = useStyles_StatusMessage();

    return (
        <div
            className={cx(
                classes.root,
                severity === "success" ? classes.success : classes.error
            )}
            role={severity === "error" ? "alert" : "status"}
        >
            <span
                className={cx(
                    classes.dot,
                    severity === "success" ? classes.dotSuccess : classes.dotError
                )}
            />
            <Text typo="body 2">{children}</Text>
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "add custom provider title"
    | "edit custom provider title"
    | "custom provider section title"
    | "custom provider section subtitle"
    | "custom provider label field"
    | "custom provider type field"
    | "openai provider option"
    | "openai compatible provider option"
    | "mistral provider option"
    | "anthropic provider option"
    | "credentials section title"
    | "credentials section subtitle"
    | "custom provider api base field"
    | "custom provider api key field"
    | "verification section title"
    | "verification section subtitle"
    | "custom provider model field"
    | "provider test"
    | "provider testing"
    | "provider test success"
    | "provider test error"
    | "set as default provider"
    | "provider save"
    | "provider update"
    | "provider cancel"
    | "close aria label"
>()({ CustomProviderFormDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ CustomProviderFormDialog }).create(({ theme }) => ({
    root: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        color: theme.colors.useCases.typography.textPrimary
    },
    body: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        paddingRight: theme.spacing(0.5)
    },
    section: {
        minWidth: 0,
        paddingBottom: theme.spacing(4),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        "& + &": {
            marginTop: theme.spacing(4)
        },
        "&:last-child": {
            borderBottom: "none",
            paddingBottom: 0
        }
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        marginTop: theme.spacing(4) + 6
    },
    verificationHeadingRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        marginBottom: theme.spacing(5)
    },
    testButton: {
        flex: "none",
        "&&": {
            minHeight: 40,
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.typography.textPrimary,
            color: theme.colors.getUseCases({ isDarkModeEnabled: false }).surfaces
                .surface1
        },
        "&&:hover": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.typography.textSecondary,
            color: theme.colors.getUseCases({ isDarkModeEnabled: false }).surfaces
                .surface1
        },
        "&&.Mui-disabled": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.buttons.actionDisabledBackground,
            color: theme.colors.useCases.typography.textDisabled
        }
    },
    testingMessage: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        minHeight: 40,
        marginTop: theme.spacing(2),
        paddingLeft: theme.spacing(2)
    },
    footer: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        paddingTop: theme.spacing(3),
        marginTop: theme.spacing(2)
    },
    defaultProviderControl: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        cursor: "pointer"
    },
    checkbox: {
        padding: 0,
        color: theme.colors.useCases.typography.textPrimary,
        "&.Mui-checked": {
            color: theme.colors.useCases.buttons.actionActive
        }
    },
    actions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(1)
    },
    cancelButton: {
        "&&": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        "&&:hover": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.buttons.actionHoverSecondary
        }
    },
    submitButton: {
        "&&": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.buttons.actionHoverPrimary,
            color: theme.colors.getUseCases({ isDarkModeEnabled: true }).typography
                .textPrimary
        },
        "&&:hover": {
            borderColor: "transparent",
            backgroundColor: theme.colors.useCases.buttons.actionActive,
            color: theme.colors.getUseCases({ isDarkModeEnabled: true }).typography
                .textPrimary
        },
        "&&.Mui-disabled": {
            borderColor: "transparent",
            backgroundColor: alpha(
                theme.colors.useCases.buttons.actionHoverPrimary,
                0.35
            ),
            color: theme.colors.getUseCases({ isDarkModeEnabled: true }).typography
                .textPrimary
        }
    }
}));

const useStyles_SideDialog = tss.withName({ SideDialog }).create(({ theme }) => ({
    root: {
        position: "fixed",
        inset: 0,
        zIndex: theme.muiTheme.zIndex.modal,
        marginRight: theme.spacing(3),
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        padding: `64px ${theme.spacing(2)}px 32px`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
        backdropFilter: "blur(1px)",
        "@media (max-width: 720px)": {
            marginRight: 0,
            padding: 0
        }
    },
    panel: {
        width: 657,
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[4],
        animation: `${keyframes`
            from {
                opacity: 0;
                transform: translateX(28px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        `} 340ms cubic-bezier(0.2, 0, 0, 1)`,
        "@media (max-width: 720px)": {
            borderRadius: 0,
            borderTop: "none",
            borderBottom: "none"
        }
    },
    headingWrapper: {
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        margin: `0 ${theme.spacing(5)}px`,
        padding: `${theme.spacing(5)}px 0 ${theme.spacing(2)}px`,
        borderBottom: `1px solid ${theme.colors.useCases.typography.textSecondary}`
    },
    title: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    closeButton: {
        flex: "none"
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        padding: `${theme.spacing(5)}px ${theme.spacing(5)}px ${theme.spacing(4)}px`,
        boxSizing: "border-box"
    }
}));

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    subtitle: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));

const useStyles_FormField = tss.withName({ FormTextField }).create(({ theme }) => {
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
                padding: `${theme.spacing(1.25)}px ${theme.spacing(5)}px ${theme.spacing(
                    1.25
                )}px ${theme.spacing(1.5)}px`
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
        modelOption: {
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1)
        },
        modelIcon: {
            flex: "none",
            color: theme.colors.useCases.buttons.actionActive
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

const useStyles_StatusMessage = tss.withName({ StatusMessage }).create(({ theme }) => ({
    root: {
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        marginTop: theme.spacing(2),
        padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
        borderRadius: 8,
        boxSizing: "border-box",
        color: theme.colors.useCases.typography.textPrimary
    },
    success: {
        backgroundColor: alpha(theme.colors.useCases.alertSeverity.success.main, 0.2)
    },
    error: {
        backgroundColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.2)
    },
    dot: {
        flex: "none",
        width: 16,
        height: 16,
        borderRadius: "50%"
    },
    dotSuccess: {
        backgroundColor: theme.colors.useCases.alertSeverity.success.main
    },
    dotError: {
        backgroundColor: theme.colors.useCases.alertSeverity.error.main
    }
}));
