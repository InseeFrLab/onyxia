import { useEffect, memo, lazy, Suspense } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { tss } from "tss";
import { assert, type Equals } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { useCoreState, useCore } from "core";
import { useFromNow } from "ui/shared/formattedDate";
import { getIconUrlByName } from "lazy-icons";

const CodeBlock = lazy(() => import("ui/shared/CodeBlock"));

export type Props = {
    className?: string;
};

export const AccountKubernetesTab = memo((props: Props) => {
    const { className } = props;

    const { classes, theme } = useStyles();

    const { k8sCodeSnippets } = useCore().functions;

    const {
        isReady,
        clusterUrl,
        namespace,
        idpIssuerUrl,
        clientId,
        refreshToken,
        idToken,
        expirationTime,
        isRefreshing,
        shellScript
    } = useCoreState("k8sCodeSnippets", "main");

    const { fromNowText } = useFromNow({ dateTime: expirationTime ?? 0 });

    useEffect(() => {
        k8sCodeSnippets.refresh();
    }, []);

    const { t } = useTranslation({ AccountKubernetesTab });

    const onFieldRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const onGetAppIconButtonClick = useConstCallback(() => {
        assert(shellScript !== undefined);
        saveAs(
            new Blob([shellScript], {
                type: "text/plain;charset=utf-8"
            }),
            "config.sh"
        );
    });

    if (!isReady) {
        return <CircularProgress />;
    }

    return (
        <div className={className}>
            <SettingSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper")}
                        &nbsp;
                        <strong>{t("expires in", { howMuchTime: fromNowText })} </strong>
                        <IconButton
                            size="extra small"
                            icon={getIconUrlByName("Refresh")}
                            onClick={() => k8sCodeSnippets.refresh()}
                            disabled={isRefreshing}
                        />
                    </>
                }
            />
            {(
                [
                    "namespace",
                    "server",
                    "idp-issuer-url",
                    "client-id",
                    "refresh-token",
                    "id-token"
                ] as const
            ).map(key => {
                const text = (() => {
                    switch (key) {
                        case "namespace":
                            return namespace;
                        case "server":
                            return clusterUrl;
                        case "idp-issuer-url":
                            return idpIssuerUrl;
                        case "client-id":
                            return clientId;
                        case "refresh-token":
                            return refreshToken;
                        case "id-token":
                            return idToken;
                    }
                    assert<Equals<typeof key, never>>(false);
                })();

                return (
                    <SettingField
                        type="text"
                        key={key}
                        title={key}
                        text={smartTrim({
                            maxLength: 50,
                            minCharAtTheEnd: 20,
                            text
                        })}
                        onRequestCopy={onFieldRequestCopyFactory(text)}
                        isSensitiveInformation={
                            key === "refresh-token" || key === "id-token"
                        }
                    />
                );
            })}
            <Divider className={classes.divider} variant="middle" />
            <SettingSectionHeader
                title={t("init script section title")}
                helperText={t("init script section helper", {
                    installKubectlUrl: "https://kubernetes.io/docs/tasks/tools/"
                })}
            />
            <div className={classes.codeBlockHeaderWrapper}>
                <div style={{ flex: 1 }} />
                <IconButton
                    icon={getIconUrlByName("GetApp")}
                    onClick={onGetAppIconButtonClick}
                    size="small"
                />
            </div>
            <Suspense fallback={<CircularProgress />}>
                {/* This component depends on a heavy third party library, we don't want to include it in the main bundle */}
                <CodeBlock
                    initScript={{
                        scriptCode: shellScript,
                        programmingLanguage: "shell"
                    }}
                    isDarkModeEnabled={theme.isDarkModeEnabled}
                />
            </Suspense>
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "credentials section title"
    | "credentials section helper"
    | "init script section title"
    | {
          K: "init script section helper";
          P: { installKubectlUrl: string };
          R: JSX.Element;
      }
    | { K: "expires in"; P: { howMuchTime: string } }
>()({ AccountKubernetesTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountKubernetesTab }).create(({ theme }) => ({
    divider: {
        ...theme.spacing.topBottom("margin", 4)
    },
    codeBlockHeaderWrapper: {
        display: "flex",
        marginBottom: theme.spacing(3)
    }
}));
