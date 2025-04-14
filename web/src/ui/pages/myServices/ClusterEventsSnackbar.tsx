import { memo, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "onyxia-ui/Alert";
import { type NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { tss } from "tss";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";

export type ClusterEventsSnackbarProps = {
    evtAction: NonPostableEvt<{
        action: "show notification";
        message: string;
        severity: "warning" | "info" | "error" | "success";
    }>;
    onOpenClusterEventsDialog: () => void;
};

export const ClusterEventsSnackbar = memo((props: ClusterEventsSnackbarProps) => {
    const { evtAction, onOpenClusterEventsDialog } = props;

    const [openState, setOpenState] = useState<
        | Pick<
              ClusterEventsSnackbarProps["evtAction"] extends NonPostableEvt<infer U>
                  ? U
                  : never,
              "message" | "severity"
          >
        | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtAction.attach(
                action => action.action === "show notification",
                ctx,
                ({ message, severity }) => {
                    setOpenState(openState => {
                        if (severity === "warning" && openState?.severity === "error") {
                            return openState;
                        }

                        return { message, severity };
                    });
                }
            );
        },
        [evtAction]
    );

    const { classes } = useStyles({
        isOpen: openState !== undefined
    });

    return (
        <Snackbar
            className={classes.root}
            open={openState !== undefined}
            autoHideDuration={10_000}
            onClose={(...[, reason]) => {
                if (reason === "clickaway") {
                    return;
                }

                setOpenState(undefined);
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert severity={openState?.severity ?? "warning"} doDisplayCross>
                <div className={classes.alertContent}>
                    {openState?.message ?? ""}
                    <IconButton
                        onClick={() => {
                            setOpenState(undefined);
                            onOpenClusterEventsDialog();
                        }}
                        icon={getIconUrlByName("ManageSearch")}
                    />
                </div>
            </Alert>
        </Snackbar>
    );
});

const useStyles = tss
    .withName({ ClusterEventsSnackbar })
    .withParams<{ isOpen: boolean }>()
    .create(({ isOpen }) => ({
        root: {
            visibility: !isOpen ? "hidden" : undefined
        },
        alertContent: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }
    }));
