import { useState, useEffect, useMemo, memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useSelector } from "app/interfaceWithLib/hooks";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "app/tools/copyToClipboard";
import Divider from "@material-ui/core/Divider";
import { makeStyles } from "app/theme";
import { getMinioToken } from "js/minio-client/minio-client";
import exportMinio from "js/components/mon-compte/export-credentials-minio";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "app/tools/smartTrim";
import { useValidUntil } from "app/i18n/useMoment";

export type Props = {
    className?: string;
};

const useStyles = makeStyles()(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4),
    },
    "link": {
        "marginTop": theme.spacing(2),
        "display": "inline-block",
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus,
    },
}));

export const AccountStorageTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const { t } = useTranslation("AccountStorageTab");

    const onRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy),
    );

    const { s3Credentials } = (function useClosure() {
        const { s3: s3Credentials } = useSelector(state => state.user);

        const [isFetching, setIsFetching] = useState(false);

        useEffect(() => {
            if (!isFetching && (!s3Credentials || !s3Credentials.AWS_EXPIRATION)) {
                setIsFetching(true);
                getMinioToken().then(() => setIsFetching(false));
            }
        }, [s3Credentials, isFetching]);

        return { s3Credentials };
    })();

    const onRequestScriptFactory = useCallbackFactory(
        ([action]: ["download" | "copy"], [scriptLabel]: [string]) => {
            assert(s3Credentials !== undefined);

            const { text, fileName } = exportMinio.find(
                ({ label }) => label === scriptLabel,
            )!;

            const scriptContent = text(s3Credentials);

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
            () => new Date(s3Credentials?.AWS_EXPIRATION ?? 0).getTime() - Date.now(),

            [s3Credentials?.AWS_EXPIRATION ?? null],
        );

        const credentialExpiriesWhen = useValidUntil({ millisecondsLeft });

        return { credentialExpiriesWhen };
    })();

    if (s3Credentials === undefined) {
        return null;
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
                        "text": s3Credentials[key],
                    })}
                    helperText={
                        <>
                            {t("accessible as env")}
                            &nbsp;
                            <span className={classes.envVar}>{`$${key}`}</span>
                        </>
                    }
                    onRequestCopy={onRequestCopyFactory(s3Credentials[key])}
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

export declare namespace AccountStorageTab {
    export type I18nScheme = {
        "credentials section title": undefined;
        "credentials section helper": undefined;
        "accessible as env": undefined;
        "init script section title": undefined;
        "init script section helper": undefined;
        "valid until": { when: string };
    };
}
