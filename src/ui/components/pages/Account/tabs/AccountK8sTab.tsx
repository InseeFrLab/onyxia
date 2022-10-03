import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { makeStyles } from "ui/theme";
import { exportK8sCredentials } from "core/exports/export-credentials-k8s";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { useFormattedDate } from "ui/useMoment";
import { useSelector, useThunks } from "ui/coreApi";
import { declareComponentKeys } from "i18nifty";
import { useAsync } from "react-async-hook";

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

    const { result: k8sParams } = useAsync(
        () => launcherThunks.getK8sParamsForProjectBucket(),
        [selectedProjectId],
    );

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const onRequestScriptFactory = useCallbackFactory(
        ([action]: ["download" | "copy"], [scriptLabel]: [string]) => {
            assert(k8sParams !== undefined);

            const { text, fileName } = exportK8sCredentials.find(
                ({ label }) => label === scriptLabel,
            )!;

            const scriptContent = text({
                ...k8sParams,
                "K8S_EXPIRATION": `${k8sParams.expirationTime}`,
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

    const scriptLabels = useMemo(
        () => exportK8sCredentials.map(({ label }) => label),
        [],
    );

    const credentialExpiriesWhen = useFormattedDate({
        time: k8sParams ? k8sParams.expirationTime * 1000 : 0,
    });
    if (k8sParams === undefined) {
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

            <AccountField
                type="text"
                title={t("k8s server url")}
                text={k8sParams.K8S_SERVER_URL}
                onRequestCopy={onRequestCopyFactory(k8sParams.K8S_SERVER_URL)}
            />

            <AccountField
                type="text"
                title={t("k8s namespace")}
                text={selectedProjectId}
                onRequestCopy={onRequestCopyFactory(selectedProjectId)}
            />

            <AccountField
                type="text"
                title={t("k8s token")}
                text={smartTrim({
                    "maxLength": 50,
                    "minCharAtTheEnd": 20,
                    "text": k8sParams.K8S_TOKEN,
                })}
                onRequestCopy={onRequestCopyFactory(k8sParams.K8S_TOKEN)}
            />

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
    | "k8s server url"
    | "k8s namespace"
    | "k8s token"
>()({ AccountK8sTab });

const useStyles = makeStyles({ "name": { AccountK8sTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
}));
