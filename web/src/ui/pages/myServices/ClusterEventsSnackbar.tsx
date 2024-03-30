import { memo, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "onyxia-ui/Alert";
import { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { tss } from "tss";

export type ClusterEventsSnackbarProps = {
    evtAction: NonPostableEvt<{
        action: "show notification";
        message: string;
        severity: "error" | "warning";
    }>;
};

export const ClusterEventsSnackbar = memo((props: ClusterEventsSnackbarProps) => {
    const { evtAction } = props;

    const [openState, setOpenState] = useState<
        | {
              message: string;
              severity: "error" | "warning";
          }
        | undefined
    >({
        "message": "Foo bar baz",
        "severity": "warning"
    });

    useEvt(
        ctx => {
            evtAction.attach(
                action => action.action === "show notification",
                ctx,
                ({ message, severity }) => {
                    setOpenState({ message, severity });
                }
            );
        },
        [evtAction]
    );

    const { classes } = useStyles({
        "isOpen": openState !== undefined
    });

    return (
        <Snackbar
            className={classes.root}
            open={openState !== undefined}
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            autoHideDuration={7_000_000}
            onClose={(...[, reason]) => {
                if (reason === "clickaway") {
                    return;
                }

                setOpenState(undefined);
            }}
            anchorOrigin={{ "vertical": "bottom", "horizontal": "center" }}
        >
            <Alert severity={openState?.severity ?? "warning"} doDisplayCross>
                {openState?.message ?? ""}
            </Alert>
        </Snackbar>
    );
});

const useStyles = tss
    .withName({ ClusterEventsSnackbar })
    .withParams<{ isOpen: boolean }>()
    .create(({ isOpen }) => ({
        "root": {
            "visibility": !isOpen ? "hidden" : undefined
        }
    }));
