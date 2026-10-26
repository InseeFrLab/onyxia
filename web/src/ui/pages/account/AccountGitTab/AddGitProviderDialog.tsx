import { useState, type FormEventHandler } from "react";
import { Link } from "@mui/material";
import { getIconUrlByName } from "lazy-icons";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import type {
    AddProviderDialogState,
    AddProviderError
} from "core/usecases/gitAccountUiController";
import { SideDialog } from "../AccountAiTab/shared/SideDialog";
import { AiAlert } from "../AccountAiTab/shared/AiAlert";
import { FormSelectField, FormTextField } from "../AccountAiTab/shared/FormFields";

type Props = {
    view: AddProviderDialogState;
    onClose: () => void;
    onSubmit: (params: {
        type: GitProvidersConfig.ProviderType;
        url: string;
        displayName: string;
        personalAccessToken: string;
    }) => void;
    getPersonalAccessTokenCreationUrl: (params: {
        type: GitProvidersConfig.ProviderType;
        url: string;
    }) => string | undefined;
};

/** Suggested when the type is picked, Forgejo instances have no well known url */
const defaultUrlByType: Record<GitProvidersConfig.ProviderType, string> = {
    gitlab: "https://gitlab.com",
    github: "https://github.com",
    forgejo: ""
};

/**
 * Where the user adds a provider of their own, with a personal access token. The
 * fields stay here, not in the core state: the token is a secret. The dialog is
 * unmounted when closed, which empties them.
 */
export function AddGitProviderDialog(props: Props) {
    const { view, onClose, onSubmit, getPersonalAccessTokenCreationUrl } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ AddGitProviderDialog });

    const [type, setType] = useState<GitProvidersConfig.ProviderType>("gitlab");
    const [url, setUrl] = useState(defaultUrlByType.gitlab);
    const [displayName, setDisplayName] = useState("");
    const [personalAccessToken, setPersonalAccessToken] = useState("");

    const personalAccessTokenCreationUrl = getPersonalAccessTokenCreationUrl({
        type,
        url
    });

    const canSubmit =
        !view.isSubmitting && url.trim() !== "" && personalAccessToken.trim() !== "";

    const onFormSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        if (canSubmit) {
            onSubmit({ type, url, displayName, personalAccessToken });
        }
    };

    return (
        <SideDialog title={t("title")} closeLabel={t("close")} onClose={onClose}>
            <form className={classes.root} onSubmit={onFormSubmit} noValidate={true}>
                <fieldset className={classes.body} disabled={view.isSubmitting}>
                    <Text typo="body 1" color="secondary">
                        {t("intro")}
                    </Text>

                    <FormSelectField
                        label={t("type")}
                        value={type}
                        onChange={value => {
                            const type_new = value as GitProvidersConfig.ProviderType;

                            // NOTE: A url the user typed is kept.
                            if (Object.values(defaultUrlByType).includes(url.trim())) {
                                setUrl(defaultUrlByType[type_new]);
                            }

                            setType(type_new);
                        }}
                        options={[
                            { value: "gitlab", label: "GitLab" },
                            { value: "github", label: "GitHub" },
                            { value: "forgejo", label: t("forgejo option") }
                        ]}
                    />

                    <div className={classes.field}>
                        <FormTextField
                            label={t("url")}
                            value={url}
                            onChange={setUrl}
                            autoComplete="url"
                            errorMessage={
                                view.error === "invalid url" ||
                                view.error === "already configured"
                                    ? t(view.error)
                                    : undefined
                            }
                        />
                        {type === "forgejo" && (
                            <Text typo="body 2" color="secondary">
                                {t("forgejo cors hint")}
                            </Text>
                        )}
                    </div>

                    <FormTextField
                        label={t("display name")}
                        value={displayName}
                        onChange={setDisplayName}
                        autoComplete="off"
                    />

                    <div className={classes.field}>
                        <FormTextField
                            label={t("personal access token")}
                            value={personalAccessToken}
                            onChange={setPersonalAccessToken}
                            autoComplete="off"
                            isSensitive={true}
                            errorMessage={
                                view.error === "personal access token rejected"
                                    ? t(view.error)
                                    : undefined
                            }
                        />
                        <Text typo="body 2" color="secondary">
                            {t("personal access token hint")}
                        </Text>
                        {personalAccessTokenCreationUrl !== undefined && (
                            <Link
                                className={classes.inlineLink}
                                href={personalAccessTokenCreationUrl}
                                target="_blank"
                                rel="noreferrer"
                                underline="hover"
                            >
                                {t("create a token")}
                                <Icon
                                    icon={getIconUrlByName("OpenInNew")}
                                    size="extra small"
                                />
                            </Link>
                        )}
                    </div>
                </fieldset>

                {/* NOTE: Out of the scrolling body, it must be seen after submitting */}
                {(view.error === "provider unreachable" ||
                    view.error === "save failed") && (
                    <AiAlert title={t("error title")} message={t(view.error)} />
                )}

                <div className={classes.footer}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                        {view.isSubmitting ? t("checking") : t("add")}
                    </Button>
                </div>
            </form>
        </SideDialog>
    );
}

const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | "intro"
    | "type"
    | "forgejo option"
    | "url"
    | "forgejo cors hint"
    | "display name"
    | "personal access token"
    | "personal access token hint"
    | "create a token"
    | "error title"
    | AddProviderError
    | "cancel"
    | "add"
    | "checking"
>()({ AddGitProviderDialog });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AddGitProviderDialog }).create(({ theme }) => ({
    root: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        color: theme.colors.useCases.typography.textPrimary
    },
    body: {
        border: 0,
        padding: 0,
        margin: 0,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
        paddingBottom: theme.spacing(6)
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    inlineLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        alignSelf: "flex-start"
    },
    footer: {
        flex: "none",
        display: "flex",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface3}`
    }
}));
