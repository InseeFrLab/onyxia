import { useEffect, memo } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { useCoreState, getCoreSync } from "core";
import { smartTrim } from "ui/tools/smartTrim";
import { getIconUrlByName } from "lazy-icons";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { Text } from "onyxia-ui/Text";

export type Props = {
    className?: string;
};

const AccountAiGatewayTab = memo((props: Props) => {
    const { className } = props;

    const { classes } = useStyles();

    const {
        functions: { ai }
    } = getCoreSync();

    const uiState = useCoreState("ai", "main");

    useEffect(() => {
        if (uiState.isEnabled && uiState.token === undefined) {
            ai.refreshToken();
        }
    }, []);

    const { t } = useTranslation({ AccountAiGatewayTab });

    const onFieldRequestCopyFactory = useCallbackFactory(([text]: [string]) =>
        copyToClipboard(text)
    );

    const onRefreshClick = useConstCallback(() => ai.refreshToken());

    const onModelChange = useConstCallback((event: { target: { value: string } }) =>
        ai.setSelectedModel({ model: event.target.value })
    );

    if (!uiState.isEnabled) {
        const { initializationStatus } = uiState;

        if (initializationStatus === "pending") {
            return <CircularProgress />;
        }

        if (
            initializationStatus === "no-account" &&
            "webUiUrl" in uiState &&
            uiState.webUiUrl !== undefined
        ) {
            return (
                <Text typo="body 1">
                    {t("no account", { webUiUrl: uiState.webUiUrl })}
                </Text>
            );
        }

        return null;
    }

    if (uiState.token === undefined) {
        return <CircularProgress />;
    }

    const { token, apiBase, webUiUrl, availableModels, selectedModel } = uiState;

    return (
        <div className={className}>
            <SettingSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper", { webUiUrl })}
                        &nbsp;
                        <IconButton
                            size="extra small"
                            icon={getIconUrlByName("Refresh")}
                            onClick={onRefreshClick}
                        />
                    </>
                }
            />
            <SettingField
                type="text"
                title={t("api base url")}
                text={smartTrim({ maxLength: 60, minCharAtTheEnd: 20, text: apiBase })}
                onRequestCopy={onFieldRequestCopyFactory(apiBase)}
                isSensitiveInformation={false}
            />
            <SettingField
                type="text"
                title={t("token")}
                text={smartTrim({ maxLength: 50, minCharAtTheEnd: 20, text: token })}
                onRequestCopy={onFieldRequestCopyFactory(token)}
                isSensitiveInformation={true}
            />
            <Divider className={classes.divider} variant="middle" />
            <SettingSectionHeader
                title={t("model section title")}
                helperText={t("model section helper")}
            />
            <FormControl className={classes.modelSelect} size="small">
                <InputLabel>{t("model label")}</InputLabel>
                <Select
                    value={selectedModel ?? ""}
                    label={t("model label")}
                    onChange={onModelChange}
                >
                    {availableModels.map(model => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
});

export default AccountAiGatewayTab;

const { i18n } = declareComponentKeys<
    | "credentials section title"
    | { K: "credentials section helper"; P: { webUiUrl: string }; R: JSX.Element }
    | "api base url"
    | "token"
    | "model section title"
    | "model section helper"
    | "model label"
    | { K: "no account"; P: { webUiUrl: string }; R: JSX.Element }
>()({ AccountAiGatewayTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountAiGatewayTab }).create(({ theme }) => ({
    divider: {
        ...theme.spacing.topBottom("margin", 4)
    },
    modelSelect: {
        minWidth: 300,
        marginTop: theme.spacing(2)
    }
}));
