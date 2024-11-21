import { useState, memo } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { useTranslation } from "ui/i18n";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import { declareComponentKeys } from "i18nifty";
import { Dialog } from "onyxia-ui/Dialog";
import { Markdown } from "ui/shared/Markdown";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { CopyOpenButton } from "./CopyOpenButton";
import LinearProgress from "@mui/material/LinearProgress";

type Props = {
    evtOpen: NonPostableEvt<void>;
    isReady: boolean;
    openUrl: string | undefined;
    servicePassword: string | undefined;
    postInstallInstructions: string | undefined;
    onRequestLogHelmGetNotes: () => void;
    lastClusterEvent:
        | { message: string; severity: "error" | "info" | "warning" }
        | undefined;
    onOpenClusterEventsDialog: () => void;
};

export const ReadmeDialog = memo((props: Props) => {
    const {
        evtOpen,
        isReady,
        openUrl,
        servicePassword,
        postInstallInstructions = "",
        onRequestLogHelmGetNotes,
        lastClusterEvent,
        onOpenClusterEventsDialog
    } = props;

    const [isOpen, setIsOpen] = useState(false);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, () => {
                onRequestLogHelmGetNotes();

                setIsOpen(true);
            });
        },
        [evtOpen, onRequestLogHelmGetNotes]
    );

    const onDialogClose = useConstCallback(() => setIsOpen(false));

    const { classes } = useStyles({
        lastClusterEventSeverity: lastClusterEvent?.severity ?? "info"
    });

    const { t } = useTranslation({ ReadmeDialog });

    return (
        <Dialog
            body={
                isOpen && (
                    <div className={classes.dialogBody}>
                        <Markdown lang="und">{postInstallInstructions}</Markdown>
                        {!isReady && (
                            <div className={classes.clusterEventWrapper}>
                                <LinearProgress />
                                {lastClusterEvent !== undefined && (
                                    <code
                                        className={classes.clusterEvent}
                                        onClick={onOpenClusterEventsDialog}
                                        // NOTE: Only to please SonarCloud
                                        onKeyDown={event => {
                                            if (event.key === "Enter") {
                                                onOpenClusterEventsDialog();
                                            }
                                        }}
                                    >
                                        {lastClusterEvent.message}
                                    </code>
                                )}
                            </div>
                        )}
                    </div>
                )
            }
            isOpen={isOpen}
            onClose={onDialogClose}
            buttons={
                isOpen && (
                    <>
                        <Button variant="secondary" onClick={onDialogClose}>
                            {t("return")}
                        </Button>
                        {!isReady ? (
                            <CircularProgress
                                className={classes.circularProgress}
                                color="textPrimary"
                                size={20}
                            />
                        ) : (
                            openUrl !== undefined && (
                                <CopyOpenButton
                                    openUrl={openUrl}
                                    servicePassword={servicePassword}
                                    onDialogClose={onDialogClose}
                                />
                            )
                        )}
                    </>
                )
            }
        />
    );
});

const useStyles = tss
    .withName({ ReadmeDialog })
    .withParams<{ lastClusterEventSeverity: "info" | "warning" | "error" | undefined }>()
    .create(({ theme, lastClusterEventSeverity }) => ({
        dialogBody: {
            maxHeight: 450,
            overflow: "auto"
        },
        circularProgress: {
            ...theme.spacing.rightLeft("margin", 3)
        },
        clusterEventWrapper: {
            marginTop: theme.spacing(5)
        },
        clusterEvent: {
            display: "block",
            marginTop: theme.spacing(2),
            fontSize: theme.typography.rootFontSizePx * 0.9,
            color: (() => {
                switch (lastClusterEventSeverity) {
                    case "error":
                        return theme.colors.useCases.alertSeverity.error.main;
                    case "warning":
                        return theme.colors.useCases.alertSeverity.warning.main;
                    case "info":
                    case undefined:
                        return undefined;
                }
            })(),
            height: theme.typography.rootFontSizePx * 5,
            overflow: "auto",
            cursor: "pointer"
        }
    }));

const { i18n } = declareComponentKeys<"ok" | "return">()({ ReadmeDialog });
export type I18n = typeof i18n;
