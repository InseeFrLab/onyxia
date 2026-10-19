import { useMemo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField, type Props as SettingFieldProps } from "ui/shared/SettingField";
import { useCoreState, getCoreSync, getCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { Text } from "onyxia-ui/Text";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { withLoader } from "ui/tools/withLoader";
import { tss } from "tss";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import memoize from "memoizee";
import { declareComponentKeys } from "i18nifty";
import { AiAlert } from "../AccountAiTab/shared/AiAlert";
import { GitProviderCard } from "./GitProviderCard";

export type Props = {
    className?: string;
};

export const AccountGitTab = withLoader({
    loader: async () => {
        const {
            functions: { gitAccountUiController }
        } = await getCore();

        // NOTE: Does nothing when GIT_PROVIDERS is empty.
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
            {gitAccountUiController.isLegacySectionVisible() ? (
                <LegacyGitFields />
            ) : (
                gitAccountUiController.isAvailable() && <GitProviders />
            )}
        </div>
    );
}

function GitProviders() {
    const {
        functions: { gitAccountUiController }
    } = getCoreSync();

    const view = useCoreState("gitAccountUiController", "main");

    const { t } = useTranslation({ AccountGitTab });
    const { classes } = useStyles();

    if (!view.isReady) {
        switch (view.stateDescription) {
            case "unreadable config":
                return (
                    <AiAlert
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
                    <AiAlert
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
                {view.description !== undefined && (
                    <LocalizedMarkdown className={classes.description}>
                        {view.description}
                    </LocalizedMarkdown>
                )}
            </div>
            <div className={classes.providerGrid}>
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
                        onStartReplacingPersonalAccessToken={() =>
                            gitAccountUiController.startReplacingPersonalAccessToken({
                                providerId: card.id
                            })
                        }
                        onCancelReplacingPersonalAccessToken={() =>
                            gitAccountUiController.cancelReplacingPersonalAccessToken({
                                providerId: card.id
                            })
                        }
                        onRemovePersonalAccessToken={() =>
                            gitAccountUiController.removePersonalAccessToken({
                                providerId: card.id
                            })
                        }
                        onSetFavorite={() =>
                            gitAccountUiController.setFavoriteProvider({
                                providerId: card.id
                            })
                        }
                    />
                ))}
            </div>
        </div>
    );
}

const editableFieldKeys = ["gitName", "gitEmail", "githubPersonalAccessToken"] as const;

type EditableFieldKey = (typeof editableFieldKeys)[number];

/** Without GIT_PROVIDERS: the tab as it has always been */
function LegacyGitFields() {
    const { t } = useTranslation({ AccountGitTab });

    const { classes } = useStyles();

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string | null]) =>
        copyToClipboard(textToCopy ?? "")
    );

    const userConfigsState = useCoreState("userConfigs", "userConfigsWithUpdateProgress");

    const {
        functions: { userConfigs }
    } = getCoreSync();

    const onRequestEditFactory = useCallbackFactory(
        ([key]: [EditableFieldKey], [value]: [string]) =>
            userConfigs.changeValue({ key, value })
    );

    const getEvtFieldAction = useMemo(
        () =>
            memoize((_key: EditableFieldKey) =>
                Evt.create<UnpackEvt<SettingFieldProps.EditableText["evtAction"]>>()
            ),
        []
    );

    const onStartEditFactory = useCallbackFactory(([key]: [EditableFieldKey]) =>
        editableFieldKeys
            .filter(id_i => id_i !== key)
            .map(id => getEvtFieldAction(id).post("SUBMIT EDIT"))
    );

    return (
        <div>
            {editableFieldKeys.map(key => {
                const { value, isBeingChanged } = userConfigsState[key];
                return (
                    <SettingField
                        key={key}
                        type="editable text"
                        title={t(key)}
                        helperText={(() => {
                            switch (key) {
                                case "gitName":
                                    return t("gitName helper text", {
                                        gitName: value ?? "",
                                        focusClassName: classes.focus
                                    });
                                case "gitEmail":
                                    return t("gitEmail helper text", {
                                        gitEmail: value ?? "",
                                        focusClassName: classes.focus
                                    });
                                case "githubPersonalAccessToken":
                                    return t("githubPersonalAccessToken helper text", {
                                        focusClassName: classes.focus
                                    });
                            }
                        })()}
                        text={value ?? undefined}
                        evtAction={getEvtFieldAction(key)}
                        onStartEdit={onStartEditFactory(key)}
                        isLocked={isBeingChanged}
                        onRequestEdit={onRequestEditFactory(key)}
                        onRequestCopy={onRequestCopyFactory(value)}
                        isSensitiveInformation={key === "githubPersonalAccessToken"}
                    />
                );
            })}
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "gitName"
    | {
          K: "gitName helper text";
          P: { gitName: string; focusClassName: string };
          R: JSX.Element;
      }
    | "gitEmail"
    | {
          K: "gitEmail helper text";
          P: { gitEmail: string; focusClassName: string };
          R: JSX.Element;
      }
    | "githubPersonalAccessToken"
    | {
          K: "githubPersonalAccessToken helper text";
          P: { focusClassName: string };
          R: JSX.Element;
      }
    | "git providers title"
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
        gap: theme.spacing(3)
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
    providerGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: theme.spacing(2),
        // Below, two cards side by side would be too narrow
        "@container (max-width: 760px)": {
            gridTemplateColumns: "1fr"
        }
    },
    focus: {
        color: theme.colors.useCases.typography.textFocus
    }
}));
