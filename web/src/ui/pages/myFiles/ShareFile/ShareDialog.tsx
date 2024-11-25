import { declareComponentKeys } from "i18nifty";
import { Button } from "onyxia-ui/Button";
import { Dialog } from "onyxia-ui/Dialog";
import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { DirectoryOrFileDetailed } from "../shared/DirectoryOrFileDetailed";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { SelectTime } from "./SelectTime";
import TextField from "@mui/material/TextField";
import { CopyToClipboardIconButton } from "ui/shared/CopyToClipboardIconButton";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import type { ShareView } from "core/usecases/fileExplorer";

export type Props = {
    shareView: ShareView | undefined;
    onClose: () => void;
    onRequestUrl: () => void;
    onChangeShareSelectedValidityDuration: (params: {
        validityDurationSecond: number;
    }) => void;
};

export const ShareDialog = memo((props: Props) => {
    const { shareView, onClose, onRequestUrl, onChangeShareSelectedValidityDuration } =
        props;

    const { t } = useTranslation({ ShareDialog });

    return (
        <Dialog
            isOpen={shareView !== undefined}
            onClose={onClose}
            body={
                shareView !== undefined ? (
                    <Body
                        shareView={shareView}
                        onRequestUrl={onRequestUrl}
                        onChangeShareSelectedValidityDuration={
                            onChangeShareSelectedValidityDuration
                        }
                    />
                ) : null
            }
            title={t("title")}
            subtitle={shareView !== undefined ? <Subtitle shareView={shareView} /> : null}
            buttons={
                <Button
                    autoFocus
                    doOpenNewTabIfHref={false}
                    onClick={onClose}
                    variant="primary"
                >
                    {t("close")}
                </Button>
            }
        />
    );
});

const Body = memo(
    (props: {
        shareView: ShareView;
        onRequestUrl: Props["onRequestUrl"];
        onChangeShareSelectedValidityDuration: Props["onChangeShareSelectedValidityDuration"];
    }) => {
        const { shareView, onRequestUrl, onChangeShareSelectedValidityDuration } = props;

        const { css, theme } = useStyles();

        const rootClassName = css({
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(6),
            marginBottom: theme.spacing(6)
        });

        return shareView.isPublic ? (
            <BodyPublic className={rootClassName} shareView={shareView} />
        ) : (
            <BodyPrivate
                className={rootClassName}
                shareView={shareView}
                onRequestUrl={onRequestUrl}
                onChangeShareSelectedValidityDuration={
                    onChangeShareSelectedValidityDuration
                }
            />
        );
    }
);

const BodyPublic = memo(
    (props: { className?: string; shareView: ShareView.PublicFile }) => {
        const { className, shareView } = props;

        const { t } = useTranslation({ ShareDialog });

        return (
            <div className={className}>
                <Text typo="label 1">
                    {t("paragraph current policy", { isPublic: true })}
                </Text>

                <Text typo="body 1">
                    {t("paragraph change policy", { isPublic: true })}
                </Text>

                <TextField
                    label={t("label input link")}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <CopyToClipboardIconButton textToCopy={shareView.url} />
                            )
                        }
                    }}
                    helperText={t("hint link access", {
                        isPublic: true,
                        expiration: undefined // TODO improve
                    })}
                    variant="standard"
                    value={shareView.url}
                />
            </div>
        );
    }
);

const BodyPrivate = memo(
    (props: {
        className?: string;
        shareView: ShareView.PrivateFile;
        onRequestUrl: () => void;
        onChangeShareSelectedValidityDuration: (params: {
            validityDurationSecond: number;
        }) => void;
    }) => {
        const {
            className,
            shareView,
            onRequestUrl,
            onChangeShareSelectedValidityDuration
        } = props;

        const { t } = useTranslation({ ShareDialog });

        const { css } = useStyles();

        return (
            <div className={className}>
                <Text typo="label 1">
                    {t("paragraph current policy", { isPublic: false })}
                </Text>

                <Text typo="body 1">
                    {t("paragraph change policy", { isPublic: false })}
                </Text>

                {shareView.url === undefined ? (
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between"
                        })}
                    >
                        <SelectTime
                            validityDurationSecond={shareView.validityDurationSecond}
                            validityDurationSecondOptions={
                                shareView.validityDurationSecondOptions
                            }
                            onChangeShareSelectedValidityDuration={
                                onChangeShareSelectedValidityDuration
                            }
                        />
                        <div
                            className={css({
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                            })}
                        >
                            <Button
                                startIcon={getIconUrlByName("Language")}
                                variant="ternary"
                                onClick={onRequestUrl}
                                disabled={shareView.isSignedUrlBeingRequested}
                            >
                                {t("create and copy link")}
                            </Button>
                            {shareView.isSignedUrlBeingRequested && (
                                <CircularProgress
                                    className={css({
                                        position: "absolute"
                                    })}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <TextField
                        label={t("label input link")}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <CopyToClipboardIconButton
                                        textToCopy={shareView.url}
                                    />
                                )
                            }
                        }}
                        helperText={t("hint link access", {
                            isPublic: false,
                            expiration: undefined // TODO improve
                        })}
                        variant="standard"
                        value={shareView.url}
                    />
                )}
            </div>
        );
    }
);

const Subtitle = memo((props: { shareView: ShareView }) => {
    const { shareView } = props;

    const { css, theme } = useStyles();

    return (
        <DirectoryOrFileDetailed
            className={css({
                padding: theme.spacing(4)
            })}
            name={shareView.file.basename}
            kind="file"
            isPublic={shareView.isPublic}
        />
    );
});

const useStyles = tss.withName({ ShareDialog }).create({});

const { i18n } = declareComponentKeys<
    | "title"
    | "close"
    | "create and copy link"
    | { K: "paragraph current policy"; P: { isPublic: boolean } }
    | { K: "paragraph change policy"; P: { isPublic: boolean } }
    | {
          K: "hint link access";
          P: { isPublic: boolean; expiration: string | undefined };
      }
    | "label input link"
>()({
    ShareDialog
});
export type I18n = typeof i18n;
