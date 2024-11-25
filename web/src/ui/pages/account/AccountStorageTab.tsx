import { useEffect, memo, lazy, Suspense } from "react";
import { useTranslation } from "ui/i18n";
import { SettingSectionHeader } from "ui/shared/SettingSectionHeader";
import { SettingField } from "ui/shared/SettingField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import Divider from "@mui/material/Divider";
import { tss } from "tss";
import { assert } from "tsafe/assert";
import { saveAs } from "file-saver";
import { smartTrim } from "ui/tools/smartTrim";
import { useFromNow } from "ui/shared/useFormattedDate";
import { useCoreState, useCore } from "core";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import type { Technology } from "core/usecases/s3CodeSnippets";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Equals } from "tsafe";
import { IconButton } from "onyxia-ui/IconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { capitalize } from "tsafe/capitalize";
import { getIconUrlByName } from "lazy-icons";

const CodeBlock = lazy(() => import("ui/shared/CodeBlock"));

const technologies = [
    "R (aws.S3)",
    "R (paws)",
    "Python (s3fs)",
    "Python (boto3)",
    "Python (polars)",
    "shell environment variables",
    "MC client",
    "s3cmd",
    "rclone"
] as const;

assert<Equals<(typeof technologies)[number], Technology>>();

export type Props = {
    className?: string;
};

export const AccountStorageTab = memo((props: Props) => {
    const { className } = props;

    const { classes, theme } = useStyles();

    const { t } = useTranslation({ AccountStorageTab });

    const { s3CodeSnippets } = useCore().functions;

    useEffect(() => {
        s3CodeSnippets.refresh({ doForceRenewToken: false });
    }, []);

    const {
        isReady,
        isRefreshing,
        credentials,
        expirationTime,
        initScript,
        selectedTechnology
    } = useCoreState("s3CodeSnippets", "main");

    const { fromNowText } = useFromNow({ dateTime: expirationTime ?? 0 });
    const onSelectChangeTechnology = useConstCallback((e: SelectChangeEvent) =>
        s3CodeSnippets.changeTechnology({
            technology: e.target.value as Technology
        })
    );

    const onFieldRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const onGetAppIconButtonClick = useConstCallback(() => {
        assert(isReady);
        saveAs(
            new Blob([initScript.scriptCode], {
                type: "text/plain;charset=utf-8"
            }),
            initScript.fileBasename
        );
    });

    const onRefreshIconButtonClick = useConstCallback(() =>
        s3CodeSnippets.refresh({ doForceRenewToken: true })
    );

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
                            onClick={onRefreshIconButtonClick}
                            disabled={isRefreshing}
                        />
                    </>
                }
            />
            {(
                [
                    "AWS_ACCESS_KEY_ID",
                    "AWS_SECRET_ACCESS_KEY",
                    "AWS_SESSION_TOKEN",
                    "AWS_S3_ENDPOINT",
                    "AWS_DEFAULT_REGION"
                ] as const
            ).map(key => (
                <SettingField
                    type="text"
                    key={key}
                    title={capitalize(
                        key.replace(/^AWS_/, "").replace(/_/g, " ").toLowerCase()
                    )}
                    text={smartTrim({
                        maxLength: 50,
                        minCharAtTheEnd: 20,
                        text: credentials[key]
                    })}
                    helperText={
                        <>
                            {t("accessible as env")}
                            &nbsp;
                            <span className={classes.envVar}>{`$${key}`}</span>
                        </>
                    }
                    onRequestCopy={onFieldRequestCopyFactory(credentials[key])}
                    isSensitiveInformation={
                        key === "AWS_SECRET_ACCESS_KEY" || key === "AWS_SESSION_TOKEN"
                    }
                />
            ))}
            <Divider className={classes.divider} variant="middle" />
            <SettingSectionHeader
                title={t("init script section title")}
                helperText={t("init script section helper")}
            />
            <div className={classes.codeBlockHeaderWrapper}>
                <FormControl>
                    <Select
                        value={selectedTechnology}
                        onChange={onSelectChangeTechnology}
                    >
                        {technologies.map(technology => (
                            <MenuItem key={technology} value={technology}>
                                {technology}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <div style={{ flex: 1 }} />
                <IconButton
                    icon={getIconUrlByName("GetApp")}
                    onClick={onGetAppIconButtonClick}
                    size="small"
                />
            </div>
            <Suspense>
                {/* This component depends on a heavy third party library, we don't want to include it in the main bundle */}
                <CodeBlock
                    initScript={initScript}
                    isDarkModeEnabled={theme.isDarkModeEnabled}
                />
            </Suspense>
        </div>
    );
});

const { i18n } = declareComponentKeys<
    | "credentials section title"
    | "credentials section helper"
    | "accessible as env"
    | "init script section title"
    | "init script section helper"
    | { K: "expires in"; P: { howMuchTime: string } }
>()({ AccountStorageTab });
export type I18n = typeof i18n;

const useStyles = tss.withName({ AccountStorageTab }).create(({ theme }) => ({
    divider: {
        ...theme.spacing.topBottom("margin", 4)
    },
    envVar: {
        color: theme.colors.useCases.typography.textFocus
    },
    codeBlockHeaderWrapper: {
        display: "flex",
        marginBottom: theme.spacing(3)
    }
}));
