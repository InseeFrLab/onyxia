import { useState, useEffect, useMemo, memo } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useCoreState, useCore } from "core";
import { fromNow } from "ui/tools/useFormatedDate";
import { tss } from "tss";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import { assert } from "tsafe/assert";
import { capitalize } from "tsafe/capitalize";
import { declareComponentKeys, useTranslation, useLang } from "ui/i18n";

type ClusterEventsDialogProps = {
    evtOpen: NonPostableEvt<void>;
};

export const ClusterEventsDialog = memo((props: ClusterEventsDialogProps) => {
    const { evtOpen } = props;

    const [isOpen, setIsOpen] = useState(false);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, () => {
                setIsOpen(true);
            });
        },
        [evtOpen]
    );

    const { clusterEventsMonitor } = useCore().functions;

    const onClose = () => {
        clusterEventsMonitor.resetNotificationCount();
        setIsOpen(false);
    };

    const clusterEvents = useCoreState("clusterEventsMonitor", "clusterEvents");

    const { windowInnerHeight } = useWindowInnerSize();

    const { lang } = useLang();

    const fromNowArr = useMemo(
        () =>
            clusterEvents.map(clusterEvent =>
                fromNow({ dateTime: clusterEvent.timestamp })
            ),
        [clusterEvents, lang]
    );

    const messageDateMaxCharCount = useMemo(
        () => Math.max(...fromNowArr.map(str => str.length)),
        [fromNowArr]
    );

    const { classes, cx } = useStyles({ windowInnerHeight, messageDateMaxCharCount });

    const [innerBodyElement, setInnerBodyElement] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (innerBodyElement === null) {
            return;
        }

        const parent = innerBodyElement.parentElement;

        assert(parent !== null);

        parent!.scrollTop = parent.scrollHeight;
    }, [innerBodyElement, clusterEvents.length]);

    const { t } = useTranslation({ ClusterEventsDialog });

    return (
        <Dialog
            title={t("title")}
            subtitle={t("subtitle")}
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            classes={{
                body: classes.body
            }}
            body={
                <div ref={setInnerBodyElement}>
                    {clusterEvents.map((clusterEvent, index) => (
                        <pre key={index}>
                            <span
                                className={cx(
                                    classes.messageDate,
                                    clusterEvent.isHighlighted && classes.messageDateNew
                                )}
                            >
                                {capitalize(fromNowArr[index])}
                            </span>
                            &nbsp;-&nbsp;
                            <span
                                className={(() => {
                                    switch (clusterEvent.severity) {
                                        case "warning":
                                            return classes.warningMessage;
                                        case "error":
                                            return classes.errorMessage;
                                        default:
                                            return undefined;
                                    }
                                })()}
                            >
                                {clusterEvent.message}
                            </span>
                        </pre>
                    ))}
                </div>
            }
            buttons={
                <>
                    <Button onClick={onClose}>Close</Button>
                </>
            }
        />
    );
});

const { i18n } = declareComponentKeys<
    | "title"
    | {
          K: "subtitle";
          R: JSX.Element;
      }
>()({ ClusterEventsDialog });
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ ClusterEventsDialog })
    .withParams<{ windowInnerHeight: number; messageDateMaxCharCount: number }>()
    .create(({ windowInnerHeight, messageDateMaxCharCount, theme }) => ({
        body: {
            height: windowInnerHeight - 200,
            overflowY: "auto",
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            ...theme.spacing.rightLeft("padding", 3)
        },
        warningMessage: {
            color: theme.colors.useCases.alertSeverity.warning.main
        },
        messageDate: {
            display: "inline-flex",
            width: messageDateMaxCharCount * theme.typography.rootFontSizePx * 0.67,
            color: theme.colors.useCases.typography.textSecondary,
            "&::before": {
                content: "'• '",
                color: "transparent"
            }
        },
        messageDateNew: {
            "&::before": {
                color: theme.colors.useCases.typography.textFocus
            }
        },
        errorMessage: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));
