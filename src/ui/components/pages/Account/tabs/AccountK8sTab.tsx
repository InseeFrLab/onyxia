import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { makeStyles } from "ui/theme";
import exportK8S from "js/components/mon-compte/export-credentials-k8s";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { useValidUntil } from "ui/useMoment";
import { useAsync } from "react-async-hook";
import { useThunks, useSelector } from "ui/coreApi";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
};

export const AccountK8sTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const { t } = useTranslation({ AccountK8sTab });

    const { launcherThunks } = useThunks();

    const selectedProjectId = useSelector(
        state => state.projectSelection.selectedProjectId,
    );

    const k8sMustacheParams = {
        "K8S_CLUSTER": "dev-insee-io",
        "K8S_USER": "ddecrulle",
        "K8S_SERVER_URL": "api-server-test.url",
        "K8S_NAMESPACE": "dev-ddecrulle",
        "K8S_TOKEN": "eyTOKEN",
        "expirationTime": 1000000,
    };

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const onRequestScriptFactory = useCallbackFactory(
        ([action]: ["download" | "copy"], [scriptLabel]: [string]) => {
            assert(k8sMustacheParams !== undefined);

            const { text, fileName } = exportK8S.find(
                ({ label }) => label === scriptLabel,
            )!;

            const scriptContent = text({
                ...k8sMustacheParams,
                "K8S_EXPIRATION": `${k8sMustacheParams.expirationTime}`,
            });

            switch (action) {
                case "copy":
                    copyToClipboard(scriptContent);
                    break;
                case "download":
                    saveAs(
                        new Blob([scriptContent], {
                            "type": "text/plain;charset=utf-8",
                        }),
                        fileName,
                    );
                    break;
            }
        },
    );

    const scriptLabels = useMemo(() => exportK8S.map(({ label }) => label), []);

    const { credentialExpiriesWhen } = (function useClosure() {
        const millisecondsLeft = useMemo(
            () => k8sMustacheParams?.expirationTime ?? 0 - Date.now(),
            [k8sMustacheParams?.expirationTime],
        );

        const credentialExpiriesWhen = useValidUntil({ millisecondsLeft });

        return { credentialExpiriesWhen };
    })();

    if (k8sMustacheParams === undefined) {
        return <span>⏳</span>;
    }

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("kubernetes section title")}
                helperText={
                    <>
                        {t("kubernetes section helper")}
                        &nbsp;
                        <strong>
                            {t("valid until", {
                                "when": credentialExpiriesWhen,
                            })}
                        </strong>
                    </>
                }
            />
            {(["K8S_SERVER_URL", "K8S_NAMESPACE", "K8S_TOKEN"] as const).map(key => (
                <AccountField
                    type="text"
                    key={key}
                    title={key.replace(/^AWS/, "").replace(/_/g, " ").toLowerCase()}
                    text={smartTrim({
                        "maxLength": 50,
                        "minCharAtTheEnd": 20,
                        "text": k8sMustacheParams[key],
                    })}
                    helperText={
                        <>
                            {"HELPER TEXT"}
                            &nbsp;
                            <span className={classes.envVar}>{`$${key}`}</span>
                        </>
                    }
                    onRequestCopy={onRequestCopyFactory(k8sMustacheParams[key])}
                />
            ))}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("automatic script section title")}
                helperText={t("automatic script section helper")}
            />
            <AccountField
                type="s3 scripts"
                scriptLabels={scriptLabels}
                onRequestCopyScript={onRequestScriptFactory("copy")}
                onRequestDownloadScript={onRequestScriptFactory("download")}
            />
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "kubernetes section title"
    | "kubernetes section helper"
    | "automatic script section title"
    | "automatic script section helper"
    | { K: "valid until"; P: { when: string } }
>()({ AccountK8sTab });

const useStyles = makeStyles({ "name": { AccountK8sTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus,
    },
}));
