import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import type { Props as AccountFieldProps } from "../AccountField";
import { useSelector, useThunks } from "ui/coreApi";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import { makeStyles } from "ui/theme";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import memoize from "memoizee";
import { useLng } from "ui/i18n/useLng";

const editableFieldKeys = [
    "gitName",
    "gitEmail",
    "githubPersonalAccessToken",
    "kaggleApiToken",
] as const;

type EditableFieldKey = typeof editableFieldKeys[number];

export type Props = {
    className?: string;
};

export const AccountIntegrationsTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountIntegrationsTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const { classes } = useStyles();

    const userConfigsState = useSelector(state => state.userConfigs);

    const { userConfigsThunks } = useThunks();

    const onRequestEditFactory = useCallbackFactory(
        ([key]: [EditableFieldKey], [value]: [string]) =>
            userConfigsThunks.changeValue({ key, value }),
    );

    const getEvtFieldAction = useMemo(
        () =>
            memoize((_key: EditableFieldKey) =>
                Evt.create<UnpackEvt<AccountFieldProps.EditableText["evtAction"]>>(),
            ),
        [],
    );

    const onStartEditFactory = useCallbackFactory(([key]: [EditableFieldKey]) =>
        editableFieldKeys
            .filter(id_i => id_i !== key)
            .map(id => getEvtFieldAction(id).post("SUBMIT EDIT")),
    );

    const { lng } = useLng();

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
                            return `https://docs.github.com/${lng}/github/authenticating-to-github/creating-a-personal-access-token`;
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
                                        serviceName,
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

export declare namespace AccountIntegrationsTab {
    export type I18nScheme = {
        "git section title": undefined;
        "git section helper": undefined;
        "gitName": undefined;
        "gitEmail": undefined;
        "third party tokens section title": undefined;
        "third party tokens section helper": undefined;
        "personal token": { serviceName: string };
        "link for token creation": { serviceName: string };
        "accessible as env": undefined;
    };
}

const useStyles = makeStyles({ "name": { AccountIntegrationsTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus,
    },
}));
