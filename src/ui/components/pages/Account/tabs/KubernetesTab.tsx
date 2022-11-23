import { useEffect, memo, lazy, Suspense } from "react";
import { useTranslation } from "ui/i18n";
import { AccountSectionHeader } from "../AccountSectionHeader";
import { AccountField } from "../AccountField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { makeStyles } from "ui/theme";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "ui/theme";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { useCoreState, selectors, useCoreFunctions } from "core";

const CodeBlock = lazy(() => import("ui/components/shared/CodeBlock"));

export type Props = {
    className?: string;
};

export const KubernetesTab = memo((props: Props) => {
    const { className } = props;

    const { classes, theme } = useStyles();

    const { k8sCredentials } = useCoreFunctions();

    const { uiState } = useCoreState(selectors.k8sCredentials.uiState);

    useEffect(() => {
        k8sCredentials.refresh();
    }, []);

    const { t } = useTranslation({ KubernetesTab });

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

    if (uiState === undefined) {
        return <CircularProgress />;
    }

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("credentials section title")}
                helperText={t("credentials section helper")}
            />
            {(
                [
                    "kubernetesNamespace",
                    "kubernetesClusterUrl",
                    "oidcAccessToken"
                ] as const
            ).map(key => (
                <AccountField
                    type="text"
                    key={key}
                    title={key}
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
                helperText={t("init script section helper")}
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
                        "fileBasename": "config",
                        "scriptCode": uiState.bashScript,
                        "programingLanguage": "shell"
                    }}
                    isDarkModeEnabled={theme.isDarkModeEnabled}
                />
            </Suspense>
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "credentials section title"
    | "credentials section helper"
    | "init script section title"
    | "init script section helper"
>()({ KubernetesTab });

const useStyles = makeStyles({ "name": { KubernetesTab } })(theme => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4)
    },
    "codeBlockHeaderWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    }
}));
