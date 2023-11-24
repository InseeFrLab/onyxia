import { useMemo, memo } from "react";
import { useTranslation, useLang } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import type { Props as AccountFieldProps } from "../AccountField";
import { useCoreState, useCore } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import { tss } from "tss";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import memoize from "memoizee";
import { declareComponentKeys } from "i18nifty";

const editableFieldKeys = [
    "gitName",
    "gitEmail",
    "githubPersonalAccessToken",
    "kaggleApiToken"
] as const;

type EditableFieldKey = (typeof editableFieldKeys)[number];

export type Props = {
    className?: string;
};

export const AccountIntegrationsTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountIntegrationsTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const { classes } = useStyles();

    const userConfigsState = useCoreState("userConfigs", "stateWithProgress");

    const { userConfigs } = useCore().functions;

    const onRequestEditFactory = useCallbackFactory(
        ([key]: [EditableFieldKey], [value]: [string]) =>
            userConfigs.changeValue({ key, value })
    );

    const getEvtFieldAction = useMemo(
        () =>
            memoize((_key: EditableFieldKey) =>
                Evt.create<UnpackEvt<AccountFieldProps.EditableText["evtAction"]>>()
            ),
        []
    );

    const onStartEditFactory = useCallbackFactory(([key]: [EditableFieldKey]) =>
        editableFieldKeys
            .filter(id_i => id_i !== key)
            .map(id => getEvtFieldAction(id).post("SUBMIT EDIT"))
    );

    const { lang } = useLang();

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("git section title")}
                helperText={t("git section helper")}
            />
            {(["gitName", "gitEmail"] as const).map(key => {
                const { value, isBeingChanged } = userConfigsState[key];

                return (
                    <AccountField
                        key={key}
                        type="editable text"
                        title={t(key)}
                        text={value}
                        evtAction={getEvtFieldAction(key)}
                        onStartEdit={onStartEditFactory(key)}
                        isLocked={isBeingChanged}
                        onRequestEdit={onRequestEditFactory(key)}
                        onRequestCopy={onRequestCopyFactory(value)}
                    />
                );
            })}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("third party tokens section title")}
                helperText={t("third party tokens section helper")}
            />
            {(["githubPersonalAccessToken", "kaggleApiToken"] as const).map(key => {
                const { value, isBeingChanged } = userConfigsState[key];

                const serviceName = (() => {
                    switch (key) {
                        case "githubPersonalAccessToken":
                            return "GitHub";
                        case "kaggleApiToken":
                            return "Kaggle";
                    }
                })();

                const tokenCreationHref = (() => {
                    switch (key) {
                        case "githubPersonalAccessToken":
                            return `https://docs.github.com/${lang}/github/authenticating-to-github/creating-a-personal-access-token`;
                        case "kaggleApiToken":
                            return `https://www.kaggle.com/docs/api`;
                    }
                })();

                const envVarName = (() => {
                    switch (key) {
                        case "githubPersonalAccessToken":
                            return "$GIT_PERSONAL_ACCESS_TOKEN";
                        case "kaggleApiToken":
                            return "$KAGGLE_TOKEN";
                    }
                })();

                return (
                    <AccountField
                        key={key}
                        type="editable text"
                        title={t("personal token", { serviceName })}
                        helperText={
                            <>
                                <Link href={tokenCreationHref} target="__blank">
                                    {t("link for token creation", {
                                        serviceName
                                    })}
                                </Link>
                                &nbsp;
                                {t("accessible as env")}
                                &nbsp;
                                <span className={classes.envVar}>{envVarName}</span>
                            </>
                        }
                        text={value ?? undefined}
                        evtAction={getEvtFieldAction(key)}
                        onStartEdit={onStartEditFactory(key)}
                        isLocked={isBeingChanged}
                        onRequestEdit={onRequestEditFactory(key)}
                        onRequestCopy={onRequestCopyFactory(value ?? "")}
                        isSensitiveInformation={true}
                    />
                );
            })}
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "git section title"
    | "git section helper"
    | "gitName"
    | "gitEmail"
    | "third party tokens section title"
    | "third party tokens section helper"
    | { K: "personal token"; P: { serviceName: string } }
    | { K: "link for token creation"; P: { serviceName: string } }
    | "accessible as env"
>()({ AccountIntegrationsTab });

const useStyles = tss.withName({ AccountIntegrationsTab }).create(({ theme }) => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4)
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus
    }
}));
