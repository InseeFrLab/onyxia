import Snackbar from "@mui/material/Snackbar";
import { Alert } from "onyxia-ui/Alert";
import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { type StatefulReadonlyEvt } from "evt";
import { useEvt } from "evt/hooks";

export type ExplorerDownloadSnackbarProps = {
    evtIsOpen: StatefulReadonlyEvt<boolean>;
};

export function ExplorerDownloadSnackbar(props: ExplorerDownloadSnackbarProps) {
    const { evtIsOpen } = props;

    const [open, setOpen] = useState<boolean>(evtIsOpen.state);

    useEvt(
        ctx => {
            evtIsOpen.attach(ctx, isOpen => setOpen(isOpen));
        },
        [evtIsOpen]
    );

    const { t } = useTranslation({ ExplorerDownloadSnackbar });

    const { classes } = useStyles();

    return (
        <Snackbar
            open={open}
            autoHideDuration={10_000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert severity="info" doDisplayCross className={classes.alert}>
                <div className={classes.content}>
                    <Text className={classes.messageText} typo="label 1">
                        {t("download preparation")}
                    </Text>
                    <CircularProgress size={18} color="inherit" />
                </div>
            </Alert>
        </Snackbar>
    );
}

const { i18n } = declareComponentKeys<"download preparation">()({
    ExplorerDownloadSnackbar
});
export type I18n = typeof i18n;

const useStyles = tss.withName({ ExplorerDownloadSnackbar }).create(({ theme }) => ({
    alert: {
        padding: theme.spacing(2),
        minWidth: 320,
        boxShadow: theme.shadows[4],
        borderRadius: theme.spacing(1.5)
    },
    content: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2)
    },
    messageText: {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    }
}));
