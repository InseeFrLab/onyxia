import { useMemo, memo } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { makeStyles } from "ui/theme";
import exportMinio from "js/components/mon-compte/export-credentials-minio";
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

export const AccountStorageTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const { t } = useTranslation({ AccountStorageTab });

    const { launcherThunks } = useThunks();

    const selectedProjectId = useSelector(
        state => state.projectSelection.selectedProjectId,
    );

    const { result: s3MustacheParams } = useAsync(
        () => launcherThunks.getS3MustacheParamsForProjectBucket(),
        [selectedProjectId],
    );

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const onRequestScriptFactory = useCallbackFactory(
        ([action]: ["download" | "copy"], [scriptLabel]: [string]) => {
            assert(s3MustacheParams !== undefined);

            const { text, fileName } = exportMinio.find(
                ({ label }) => label === scriptLabel,
            )!;

            const scriptContent = text({
                ...s3MustacheParams,
                "AWS_EXPIRATION": `${s3MustacheParams.expirationTime}`,
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

    const scriptLabels = useMemo(() => exportMinio.map(({ label }) => label), []);

    const { credentialExpiriesWhen } = (function useClosure() {
        const millisecondsLeft = useMemo(
            () => s3MustacheParams?.expirationTime ?? 0 - Date.now(),
            [s3MustacheParams?.expirationTime],
        );

        const credentialExpiriesWhen = useValidUntil({ millisecondsLeft });

        return { credentialExpiriesWhen };
    })();

    if (s3MustacheParams === undefined) {
        return <span>⏳</span>;
    }

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper")}
                        &nbsp;
                        <strong>
                            {t("valid until", {
                                "when": credentialExpiriesWhen,
                            })}
                        </strong>
                    </>
                }
            />
            {(
                [
                    "AWS_ACCESS_KEY_ID",
                    "AWS_SECRET_ACCESS_KEY",
                    "AWS_SESSION_TOKEN",
                    "AWS_S3_ENDPOINT",
                ] as const
            ).map(key => (
                <AccountField
                    type="text"
                    key={key}
                    title={key.replace(/^AWS/, "").replace(/_/g, " ").toLowerCase()}
                    text={smartTrim({
                        "maxLength": 50,
                        "minCharAtTheEnd": 20,
                        "text": s3MustacheParams[key],
                    })}
                    helperText={
                        <>
                            {t("accessible as env")}
                            &nbsp;
                            <span className={classes.envVar}>{`$${key}`}</span>
                        </>
                    }
                    onRequestCopy={onRequestCopyFactory(s3MustacheParams[key])}
                />
            ))}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("init script section title")}
                helperText={t("init script section helper")}
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
    | "credentials section title"
    | "credentials section helper"
    | "accessible as env"
    | "init script section title"
    | "init script section helper"
    | { K: "valid until"; P: { when: string } }
>()({ AccountStorageTab });

const useStyles = makeStyles({ "name": { AccountStorageTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus,
    },
}));
