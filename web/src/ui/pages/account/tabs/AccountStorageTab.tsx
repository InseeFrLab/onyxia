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
import { useFromNow } from "ui/shared/useMoment";
import { useCoreFunctions, useCoreState, selectors } from "core";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import type { Technology } from "core/usecases/s3Credentials";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Equals } from "tsafe";
import { IconButton } from "ui/theme";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { capitalize } from "tsafe/capitalize";

const CodeBlock = lazy(() => import("ui/shared/CodeBlock"));

const technologies = [
    "R (aws.S3)",
    "R (paws)",
    "Python (s3fs)",
    "Python (boto3)",
    "shell environnement variables",
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

    const { s3Credentials } = useCoreFunctions();

    useEffect(() => {
        s3Credentials.refresh({ "doForceRenewToken": false });
    }, []);

    const { isReady } = useCoreState(selectors.s3Credentials.isReady);
    const { credentials } = useCoreState(selectors.s3Credentials.credentials);
    const { expirationTime } = useCoreState(selectors.s3Credentials.expirationTime);
    const { initScript } = useCoreState(selectors.s3Credentials.initScript);
    const { selectedTechnology } = useCoreState(
        selectors.s3Credentials.selectedTechnology
    );
    const { isRefreshing } = useCoreState(selectors.s3Credentials.isRefreshing);

    const { fromNowText } = useFromNow({ "dateTime": expirationTime ?? 0 });

    const onSelectChangeTechnology = useConstCallback((e: SelectChangeEvent) =>
        s3Credentials.changeTechnology({
            "technology": e.target.value as Technology
        })
    );

    const onFieldRequestCopyFactory = useCallbackFactory(([textToCopy]: [string]) =>
        copyToClipboard(textToCopy)
    );

    const onGetAppIconButtonClick = useConstCallback(() => {
        assert(initScript !== undefined);
        saveAs(
            new Blob([initScript.scriptCode], {
                "type": "text/plain;charset=utf-8"
            }),
            initScript.fileBasename
        );
    });

    const onRefreshIconButtonClick = useConstCallback(() =>
        s3Credentials.refresh({ "doForceRenewToken": true })
    );

    if (!isReady) {
        return <CircularProgress />;
    }

    assert(credentials !== undefined);
    assert(expirationTime !== undefined);
    assert(initScript !== undefined);
    assert(selectedTechnology !== undefined);
    assert(isRefreshing !== undefined);

    return (
        <div className={className}>
            <AccountSectionHeader
                title={t("credentials section title")}
                helperText={
                    <>
                        {t("credentials section helper")}
                        &nbsp;
                        <strong>
                            {t("expires in", { "howMuchTime": fromNowText })}{" "}
                        </strong>
                        <IconButton
                            size="extra small"
                            iconId="refresh"
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
                <AccountField
                    type="text"
                    key={key}
                    title={capitalize(
                        key.replace(/^AWS_/, "").replace(/_/g, " ").toLowerCase()
                    )}
                    text={smartTrim({
                        "maxLength": 50,
                        "minCharAtTheEnd": 20,
                        "text": credentials[key]
                    })}
                    helperText={
                        <>
                            {t("accessible as env")}
                            &nbsp;
                            <span className={classes.envVar}>{`$${key}`}</span>
                        </>
                    }
                    onRequestCopy={onFieldRequestCopyFactory(credentials[key])}
                />
            ))}
            <Divider className={classes.divider} variant="middle" />
            <AccountSectionHeader
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
                <div style={{ "flex": 1 }} />
                <IconButton
                    iconId="getApp"
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

export const { i18n } = declareComponentKeys<
    | "credentials section title"
    | "credentials section helper"
    | "accessible as env"
    | "init script section title"
    | "init script section helper"
    | { K: "expires in"; P: { howMuchTime: string } }
>()({ AccountStorageTab });

const useStyles = tss.withName({ AccountStorageTab }).create(({ theme }) => ({
    "divider": {
        ...theme.spacing.topBottom("margin", 4)
    },
    "envVar": {
        "color": theme.colors.useCases.typography.textFocus
    },
    "codeBlockHeaderWrapper": {
        "display": "flex",
        "marginBottom": theme.spacing(3)
    }
}));
