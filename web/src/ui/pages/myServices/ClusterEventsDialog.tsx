import { useState, memo } from "react";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { Dialog } from "onyxia-ui/Dialog";
import { Button } from "onyxia-ui/Button";
import { useCoreState, useCore } from "core";
import { fromNow } from "ui/shared/useMoment";

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

    return (
        <Dialog
            title="Cluster events"
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            body={
                <>
                    {clusterEvents.map((clusterEvent, index) => (
                        <pre
                            key={index}
                            style={{
                                "border": clusterEvent.isHighlighted
                                    ? "1px solid red"
                                    : undefined
                            }}
                        >
                            {fromNow({
                                "dateTime": clusterEvent.timestamp
                            })}
                            {clusterEvent.message.substring(0, 60)}
                        </pre>
                    ))}
                </>
            }
            buttons={
                <>
                    <Button onClick={onClose}>Close</Button>
                </>
            }
        />
    );
});
