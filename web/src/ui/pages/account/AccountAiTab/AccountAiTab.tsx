import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";
import { useCoreState, getCoreSync, getCore } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Stack, Box } from "@mui/material";
import { ProviderCard } from "./ProviderCard";
import { FormSelectField } from "./shared/FormFields";
import { AiAlert } from "./shared/AiAlert";
import { Text } from "onyxia-ui/Text";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { AddCustomProviderButton } from "./AddCustomProviderButton";
import { ManageProvidersDialog } from "./dialogs/ManageProvidersDialog";
import { CustomProviderFormDialog } from "./dialogs/CustomProviderFormDialog";
import { withLoader } from "ui/tools/withLoader";
import { tss } from "tss";

export type Props = { className?: string };

export const AccountAiTab = withLoader({
    loader: async () => {
        const {
            functions: { aiAccountUiController: account }
        } = await getCore();

        await account.load();
    },
    FallbackComponent: () => null,
    Component
});

function Component(props: Props) {
    const {
        functions: { aiAccountUiController: account, aiProviderFormUiController: form }
    } = getCoreSync();

    const view = useCoreState("aiAccountUiController", "main");

    const { t } = useTranslation({ AccountAiTab });
    const { classes, cx } = useStyles();

    if (!view.isReady) {
        switch (view.stateDescription) {
            case "unreadable config":
                return (
                    <AiAlert
                        title={t("unreadable config title")}
                        message={t("unreadable config")}
                        action={{
                            label: t("reset config"),
                            onClick: () => account.resetConfig()
                        }}
                    />
                );
            case "loading failed":
                return (
                    <AiAlert
                        title={t("gateway error")}
                        message={t("gateway error details")}
                        action={{ label: t("retry"), onClick: () => account.load() }}
                    />
                );
            case "loading":
                return <CircularProgress />;
        }
    }

    return (
        <Stack className={cx(classes.root, props.className)} spacing={4}>
            {view.hasSaveFailed && (
                <AiAlert
                    title={t("save failed")}
                    message={t("save failed details")}
                    action={{ label: t("retry"), onClick: () => account.retrySave() }}
                />
            )}
            <Stack spacing={1}>
                <Text typo="section heading">{t("ai providers title")}</Text>
                {view.description !== undefined && (
                    <LocalizedMarkdown className={classes.description}>
                        {view.description}
                    </LocalizedMarkdown>
                )}
            </Stack>
            <Box className={classes.providerGrid}>
                <FormSelectField
                    label={t("default model")}
                    placeholder={t("default model")}
                    value={view.defaultModel.value ?? ""}
                    onChange={model => account.setDefaultModel({ model })}
                    options={view.defaultModel.optionGroups.map(
                        ({ providerName, options }) => ({
                            groupLabel: providerName,
                            options: options.map(({ value, modelId }) => ({
                                value,
                                label: modelId,
                                // Once picked, display providerName/modelId instead of just modelId,
                                selectedLabel: value
                            }))
                        })
                    )}
                />
            </Box>
            <Box className={classes.providerGrid}>
                {view.providerCards.map(card => (
                    <ProviderCard
                        key={`${card.origin}/${card.name}`}
                        name={card.name}
                        subtitle={
                            card.origin === "configured by admin"
                                ? t("provided by organization")
                                : t("custom providers section title")
                        }
                        state={card.connectionState}
                        logoUrl={card.logoUrl}
                        modelSelector={{
                            isDisabled: card.models.isDisabled,
                            models: card.models.available,
                            selectedModels: card.models.selected,
                            onSelectedModelsChange: modelIds =>
                                account.setSelectedModelIds({
                                    providerName: card.name,
                                    modelIds
                                })
                        }}
                        manageLabel={t("manage")}
                        onManage={() => form.open({ providerName: card.name })}
                    />
                ))}
                {account.canUserCreateProviders() && (
                    <AddCustomProviderButton
                        className={classes.addCustomProviderButton}
                        label={t("add custom ai provider")}
                        onClick={() => form.open({ providerName: undefined })}
                    />
                )}
            </Box>
            <ManageProvidersDialog />
            <CustomProviderFormDialog />
        </Stack>
    );
}

const useStyles = tss.withName({ AccountAiTab }).create(({ theme }) => {
    return {
        // The grid adapts to the width of the tab, not to the one of the window
        root: {
            containerType: "inline-size"
        },
        providerGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: theme.spacing(2),
            // Below, two cards side by side would be too narrow
            "@container (max-width: 760px)": {
                gridTemplateColumns: "1fr"
            }
        },
        description: {
            ...theme.typography.variants["body 1"].style,
            color: theme.colors.useCases.typography.textSecondary,
            "& > p": {
                margin: 0
            }
        },
        addCustomProviderButton: {
            // Always on its own row, below the providers, across the whole tab
            gridColumn: "1 / -1"
        }
    };
});

const { i18n } = declareComponentKeys<
    | "ai providers title"
    | "default model"
    | "save failed"
    | "save failed details"
    | "retry"
    | "provided by organization"
    | "manage"
    | "gateway error"
    | "gateway error details"
    | "custom providers section title"
    | "add custom ai provider"
    | "unreadable config title"
    | "unreadable config"
    | "reset config"
>()({ AccountAiTab });
export type I18n = typeof i18n;
