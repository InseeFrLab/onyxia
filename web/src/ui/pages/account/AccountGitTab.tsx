import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingField, type Props as SettingFieldProps } from "ui/shared/SettingField";
import { useCoreState, getCoreSync } from "core";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import memoize from "memoizee";
import { declareComponentKeys } from "i18nifty";

const editableFieldKeys = ["gitName", "gitEmail", "githubPersonalAccessToken"] as const;

type EditableFieldKey = (typeof editableFieldKeys)[number];

export type Props = {
    className?: string;
};

const AccountGitTab = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ AccountGitTab });

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string | null]) =>
        copyToClipboard(textToCopy ?? "")
    );

    const { classes } = useStyles();

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
        <div className={className}>
            {(["gitName", "gitEmail", "githubPersonalAccessToken"] as const).map(key => {
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
});

export default AccountGitTab;

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
>()({ AccountGitTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountGitTab }).create(({ theme }) => ({
    focus: {
        color: theme.colors.useCases.typography.textFocus
    }
}));
