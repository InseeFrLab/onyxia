import { useEffect, memo, lazy, Suspense } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { tss } from "ui/theme";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "ui/theme";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { useCoreState, selectors, useCoreFunctions } from "core";
import { useFromNow } from "ui/shared/useMoment";
import type { Link } from "type-route";
import { routes } from "ui/routes";
import { capitalize } from "tsafe/capitalize";

const CodeBlock = lazy(() => import("ui/shared/CodeBlock"));

export type Props = {
    className?: string;
};

export const AccountVaultTab = memo((props: Props) => {
    const { className } = props;

    const { classes, theme } = useStyles();

    const { vaultCredentials } = useCoreFunctions();

    const { uiState } = useCoreState(selectors.vaultCredentials.uiState);

    const { fromNowText } = useFromNow({ "dateTime": uiState?.expirationTime ?? 0 });

    useEffect(() => {
        vaultCredentials.refresh({ "doForceRenewToken": false });
    }, []);

    const { t } = useTranslation({ AccountVaultTab });

    const onFieldRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const onGetAppIconButtonClick = useConstCallback(() => {
        assert(uiState !== undefined);
        saveAs(
            new Blob([uiState.bashScript], {
                "type": "text/plain;charset=utf-8"
            }),
            "config"
        );
    });

    const onRefreshIconButtonClick = useConstCallback(() =>
        vaultCredentials.refresh({ "doForceRenewToken": true })
    );

    if (uiState === undefined) {
        return <CircularProgress />;
    }

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper", {
                            "vaultDocHref": "https://developer.hashicorp.com/vault",
                            "mySecretLink": routes.mySecrets().link
                        })}
                        &nbsp;
                        <strong>
                            {t("expires in", { "howMuchTime": fromNowText })}{" "}
                        </strong>
                        <IconButton
                            size="extra small"
                            iconId="refresh"
                            onClick={onRefreshIconButtonClick}
                            disabled={uiState.isRefreshing}
                        />
                    </>
                }
            />
            {(["vaultUrl", "vaultToken"] as const).map(key => (
                <AccountField
                    type="text"
                    key={key}
                    title={capitalize(
                        key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
                    )}
                    text={smartTrim({
                        "maxLength": 50,
                        "minCharAtTheEnd": 20,
                        "text": uiState[key]
                    })}
                    onRequestCopy={onFieldRequestCopyFactory(uiState[key])}
                />
            ))}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
                title={t("init script section title")}
                helperText={t("init script section helper", {
                    "vaultCliDocLink":
                        "https://developer.hashicorp.com/vault/docs/commands"
                })}
            />
            <div className={classes.codeBlockHeaderWrapper}>
                <div style={{ "flex": 1 }} />
                <IconButton
                    iconId="getApp"
                    onClick={onGetAppIconButtonClick}
                    size="small"
                />
            </div>
            <Suspense fallback={<CircularProgress />}>
                {/* This component depends on a heavy third party library, we don't want to include it in the main bundle */}
                <CodeBlock
                    initScript={{
                        "scriptCode": uiState.bashScript,
                        "programmingLanguage": "shell"
                    }}
                    isDarkModeEnabled={theme.isDarkModeEnabled}
                />
            </Suspense>
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "credentials section title"
    | {
          K: "credentials section helper";
          P: { vaultDocHref: string; mySecretLink: Link };
          R: JSX.Element;
      }
    | "init script section title"
    | { K: "init script section helper"; P: { vaultCliDocLink: string }; R: JSX.Element }
    | { K: "expires in"; P: { howMuchTime: string } }
>()({ AccountVaultTab });

const useStyles = tss.withName({ AccountVaultTab }).create(({ theme }) => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4)
    },
    "codeBlockHeaderWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    }
}));
