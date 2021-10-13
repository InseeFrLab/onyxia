import { useState } from "react";
import { Paper, Fab, Icon, Tooltip } from "@mui/material/";
import Dialog from "js/components/commons/dialog";
import D from "js/i18n";

interface Props {
    handleDelete?: () => void;
    handleRefresh?: () => void;
    monitoringUrl?: string;
}

const Toolbar = ({ handleDelete, handleRefresh, monitoringUrl }: Props) => {
    const [dialog, setDialog] = useState(false);
    const wantDelete = () => {
        setDialog(true);
    };
    const onValid = () => {
        setDialog(false);
        handleDelete!();
    };
    const onCancel = () => {
        setDialog(false);
    };
    return (
        <Paper className="onyxia-toolbar" elevation={1}>
            <Actions
                handleDelete={wantDelete}
                handleRefresh={handleRefresh}
                monitoringUrl={monitoringUrl}
            />
            <Dialog
                open={dialog}
                title={D.myServiceDialogTitle}
                subtitle={D.myServiceDialogSubtitle}
                body={D.myServiceDialogBody}
                warn={D.myServiceDialogWarn}
                onValid={onValid}
                onCancel={onCancel}
            />
        </Paper>
    );
};

const Actions = ({ handleDelete, handleRefresh, monitoringUrl }: any) => (
    <>
        {handleRefresh && (
            <Tooltip title="Refresh">
                <Fab
                    color="secondary"
                    aria-label="refresh"
                    classes={{ root: "bouton" }}
                    onClick={handleRefresh}
                >
                    <Icon>refresh</Icon>
                </Fab>
            </Tooltip>
        )}
        {monitoringUrl && (
            <Tooltip title="Monitoring">
                <Fab
                    color="secondary"
                    aria-label="monitor"
                    classes={{ root: "bouton" }}
                    onClick={() => window.open(monitoringUrl)}
                >
                    <Icon>equalizer</Icon>
                </Fab>
            </Tooltip>
        )}
        {handleDelete && (
            <Tooltip title="Delete">
                <Fab
                    color="secondary"
                    aria-label="delete"
                    classes={{ root: "bouton" }}
                    onClick={handleDelete}
                >
                    <Icon>deleteAll</Icon>
                </Fab>
            </Tooltip>
        )}
    </>
);

export default Toolbar;
