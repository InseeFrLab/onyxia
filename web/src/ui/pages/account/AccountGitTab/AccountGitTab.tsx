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
import { GitForgeCard } from "./GitForgeCard";
import { AddGitForgeDialog, ManageGitForgeDialog } from "./AddGitForgeDialog";
import { ConfirmGitForgeRemovalDialog } from "./ConfirmGitForgeRemovalDialog";
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
            {gitAccountUiController.isAvailable() && <GitForges />}
        </div>
    );
}

function GitForges() {
    const {
        functions: { gitAccountUiController }
    } = getCoreSync();

    const view = useCoreState("gitAccountUiController", "main");
    const addForgeDialog = useCoreState("gitAccountUiController", "addForgeDialog");
    const manageForgeDialog = useCoreState("gitAccountUiController", "manageForgeDialog");

    const { t } = useTranslation({ AccountGitTab });
    const { classes } = useStyles();

    const [forgeIdToRemove, setForgeIdToRemove] = useState<string | undefined>(undefined);

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
                <Text typo="section heading">{t("git forges title")}</Text>
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
            {view.forgeCards.length === 0 && (
                <Text typo="body 1" color="secondary">
                    {t("no git forges")}
                </Text>
            )}
            <div className={classes.forgeList}>
                {view.forgeCards.map(card => (
                    <GitForgeCard
                        key={card.id}
                        card={card}
                        onSignIn={() =>
                            gitAccountUiController.signIn({ forgeId: card.id })
                        }
                        onSignOut={() =>
                            gitAccountUiController.signOut({ forgeId: card.id })
                        }
                        onSetPersonalAccessToken={({ personalAccessToken }) =>
                            gitAccountUiController.setPersonalAccessToken({
                                forgeId: card.id,
                                personalAccessToken
                            })
                        }
                        onStartEditingPersonalAccessToken={() =>
                            gitAccountUiController.startEditingPersonalAccessToken({
                                forgeId: card.id
                            })
                        }
                        onCancelEditingPersonalAccessToken={() =>
                            gitAccountUiController.cancelEditingPersonalAccessToken({
                                forgeId: card.id
                            })
                        }
                        onManage={() =>
                            gitAccountUiController.openManageForgeDialog({
                                forgeId: card.id
                            })
                        }
                    />
                ))}
                {gitAccountUiController.canUserAddForges() && (
                    <AddCustomProviderButton
                        className={classes.addForgeButton}
                        label={t("add git forge")}
                        onClick={gitAccountUiController.openAddForgeDialog}
                    />
                )}
            </div>
            {addForgeDialog.isOpen && (
                <AddGitForgeDialog
                    view={addForgeDialog}
                    onClose={gitAccountUiController.closeAddForgeDialog}
                    onSubmit={gitAccountUiController.addForge}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            {manageForgeDialog.isOpen && (
                <ManageGitForgeDialog
                    view={manageForgeDialog}
                    onForgeChange={forgeId =>
                        gitAccountUiController.openManageForgeDialog({ forgeId })
                    }
                    onClose={gitAccountUiController.closeManageForgeDialog}
                    onSubmit={gitAccountUiController.saveManagedForge}
                    onDelete={() => {
                        const { card } = manageForgeDialog;

                        gitAccountUiController.closeManageForgeDialog();

                        if (card.isAddedByUser) {
                            // NOTE: Confirmed first, it is removed as a whole.
                            setForgeIdToRemove(card.id);
                            return;
                        }

                        gitAccountUiController.removePersonalAccessToken({
                            forgeId: card.id
                        });
                    }}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            <ConfirmGitForgeRemovalDialog
                forgeName={
                    view.forgeCards.find(({ id }) => id === forgeIdToRemove)?.displayName
                }
                onClose={({ doProceed }) => {
                    if (doProceed && forgeIdToRemove !== undefined) {
                        gitAccountUiController.removeForge({
                            forgeId: forgeIdToRemove
                        });
                    }
                    setForgeIdToRemove(undefined);
                }}
            />
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "git forges title"
    | "git profiles subtitle"
    | "no git forges"
    | "add git forge"
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
    forgeList: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
        // Below, two cards side by side would be too narrow
        "@container (max-width: 760px)": {
            gridTemplateColumns: "1fr"
        }
    },
    addForgeButton: {
        // Always on its own row, below the forges, across the whole width, like in the AI tab
        gridColumn: "1 / -1"
    }
}));
