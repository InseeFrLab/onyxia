import { useState } from "react";
import { useTranslation } from "ui/i18n";
import { useCoreState, getCoreSync, getCore } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { withLoader } from "ui/tools/withLoader";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { ErrorAlert } from "ui/shared/ErrorAlert";
import { GitProviderCard } from "./GitProviderCard";
import { AddGitProviderDialog, ManageGitProviderDialog } from "./AddGitProviderDialog";
import { ConfirmGitProviderRemovalDialog } from "./ConfirmGitProviderRemovalDialog";
import { AddCustomProviderButton } from "ui/shared/AddCustomProviderButton";

export type Props = {
    className?: string;
};

export const AccountGitTab = withLoader({
    loader: async () => {
        const {
            functions: { gitAccountUiController }
        } = await getCore();

        // NOTE: Does nothing when the integration is disabled.
        await gitAccountUiController.load();
    },
    Component
});

function Component(props: Props) {
    const { className } = props;

    const {
        functions: { gitAccountUiController }
    } = getCoreSync();

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            {gitAccountUiController.isAvailable() && <GitProviders />}
        </div>
    );
}

function GitProviders() {
    const {
        functions: { gitAccountUiController }
    } = getCoreSync();

    const view = useCoreState("gitAccountUiController", "main");
    const addProviderDialog = useCoreState("gitAccountUiController", "addProviderDialog");
    const manageProviderDialog = useCoreState(
        "gitAccountUiController",
        "manageProviderDialog"
    );

    const { t } = useTranslation({ AccountGitTab });
    const { classes } = useStyles();

    const [providerIdToRemove, setProviderIdToRemove] = useState<string | undefined>(
        undefined
    );

    if (!view.isReady) {
        switch (view.stateDescription) {
            case "unreadable config":
                return (
                    <ErrorAlert
                        title={t("unreadable config title")}
                        message={t("unreadable config")}
                        action={{
                            label: t("reset config"),
                            onClick: () => gitAccountUiController.resetConfig()
                        }}
                    />
                );
            case "loading failed":
                return (
                    <ErrorAlert
                        title={t("loading failed title")}
                        message={t("loading failed")}
                        action={{
                            label: t("retry"),
                            onClick: () => gitAccountUiController.load()
                        }}
                    />
                );
            case "loading":
                return <CircularProgress />;
        }
    }

    return (
        <div className={classes.section}>
            <div className={classes.sectionHeader}>
                <Text typo="section heading">{t("git providers title")}</Text>
                {view.description !== undefined ? (
                    <LocalizedMarkdown className={classes.description}>
                        {view.description}
                    </LocalizedMarkdown>
                ) : (
                    <Text typo="body 1" color="secondary">
                        {t("git profiles subtitle")}
                    </Text>
                )}
            </div>
            {view.providerCards.length === 0 && (
                <Text typo="body 1" color="secondary">
                    {t("no git providers")}
                </Text>
            )}
            <div className={classes.providerList}>
                {view.providerCards.map(card => (
                    <GitProviderCard
                        key={card.id}
                        card={card}
                        onSignIn={() =>
                            gitAccountUiController.signIn({ providerId: card.id })
                        }
                        onSignOut={() =>
                            gitAccountUiController.signOut({ providerId: card.id })
                        }
                        onSetPersonalAccessToken={({ personalAccessToken }) =>
                            gitAccountUiController.setPersonalAccessToken({
                                providerId: card.id,
                                personalAccessToken
                            })
                        }
                        onStartEditingPersonalAccessToken={() =>
                            gitAccountUiController.startEditingPersonalAccessToken({
                                providerId: card.id
                            })
                        }
                        onCancelEditingPersonalAccessToken={() =>
                            gitAccountUiController.cancelEditingPersonalAccessToken({
                                providerId: card.id
                            })
                        }
                        onManage={() =>
                            gitAccountUiController.openManageProviderDialog({
                                providerId: card.id
                            })
                        }
                    />
                ))}
                {gitAccountUiController.canUserAddProviders() && (
                    <AddCustomProviderButton
                        className={classes.addProviderButton}
                        label={t("add git provider")}
                        onClick={gitAccountUiController.openAddProviderDialog}
                    />
                )}
            </div>
            {addProviderDialog.isOpen && (
                <AddGitProviderDialog
                    view={addProviderDialog}
                    onClose={gitAccountUiController.closeAddProviderDialog}
                    onSubmit={gitAccountUiController.addProvider}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            {manageProviderDialog.isOpen && (
                <ManageGitProviderDialog
                    view={manageProviderDialog}
                    onProviderChange={providerId =>
                        gitAccountUiController.openManageProviderDialog({ providerId })
                    }
                    onClose={gitAccountUiController.closeManageProviderDialog}
                    onSubmit={gitAccountUiController.saveManagedProvider}
                    onDelete={() => {
                        const { card } = manageProviderDialog;

                        gitAccountUiController.closeManageProviderDialog();

                        if (card.isAddedByUser) {
                            // NOTE: Confirmed first, it is removed as a whole.
                            setProviderIdToRemove(card.id);
                            return;
                        }

                        gitAccountUiController.removePersonalAccessToken({
                            providerId: card.id
                        });
                    }}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            <ConfirmGitProviderRemovalDialog
                providerName={
                    view.providerCards.find(({ id }) => id === providerIdToRemove)
                        ?.displayName
                }
                onClose={({ doProceed }) => {
                    if (doProceed && providerIdToRemove !== undefined) {
                        gitAccountUiController.removeProvider({
                            providerId: providerIdToRemove
                        });
                    }
                    setProviderIdToRemove(undefined);
                }}
            />
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "git providers title"
    | "git profiles subtitle"
    | "no git providers"
    | "add git provider"
    | "unreadable config title"
    | "unreadable config"
    | "reset config"
    | "loading failed title"
    | "loading failed"
    | "retry"
>()({ AccountGitTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountGitTab }).create(({ theme }) => ({
    // The grid adapts to the width of the tab, not to the one of the window
    root: {
        containerType: "inline-size",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(6)
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4)
    },
    sectionHeader: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    description: {
        ...theme.typography.variants["body 1"].style,
        color: theme.colors.useCases.typography.textSecondary,
        "& > p": {
            margin: 0
        }
    },
    providerList: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
        // Below, two cards side by side would be too narrow
        "@container (max-width: 760px)": {
            gridTemplateColumns: "1fr"
        }
    },
    addProviderButton: {
        // Always on its own row, below the providers, across the whole width, like in the AI tab
        gridColumn: "1 / -1"
    }
}));
