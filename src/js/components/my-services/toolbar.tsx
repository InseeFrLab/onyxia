import { useState } from "react";
import { Paper, Fab, Icon, Tooltip } from "@mui/material/";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Dialog from "js/components/commons/dialog";
import D from "js/i18n";
import * as clipboard from "clipboard-polyfill";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { routes } from "ui/routes";

interface Props {
    hasService: Boolean;
    userPassword?: String;
    handleDeleteAll?: () => void;
    handlePauseAll?: () => void;
    handleRefresh?: () => void;
}

const Toolbar = ({
    hasService,
    userPassword,
    handleDeleteAll,
    handlePauseAll,
    handleRefresh
}: Props) => {
    const [dialog, setDialog] = useState(false);
    const wantDelete = () => {
        setDialog(true);
    };
    const onValid = () => {
        setDialog(false);
        handleDeleteAll!();
    };
    const onCancel = () => {
        setDialog(false);
    };
    return (
        <Paper className="onyxia-toolbar" elevation={1}>
            <Actions
                hasService={hasService}
                userPassword={userPassword}
                handleDeleteAll={wantDelete}
                handlePauseAll={handlePauseAll}
                handleRefresh={handleRefresh}
            />
            <Dialog
                open={dialog}
                title={D.myServicesDialogTitle}
                subtitle={D.myServicesDialogSubtitle}
                body={D.myServicesDialogBody}
                warn={D.myServicesDialogWarn}
                onValid={onValid}
                onCancel={onCancel}
            />
        </Paper>
    );
};

const Actions = ({
    hasService,
    userPassword,
    handleDeleteAll,
    handlePauseAll,
    handleRefresh
}: any) => (
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
        <a {...routes.catalogExplorer().link}>
            <Tooltip title="New service">
                <Fab
                    color="secondary"
                    aria-label="New service"
                    classes={{ root: "bouton" }}
                >
                    <Icon>add</Icon>
                </Fab>
            </Tooltip>
        </a>
        {hasService && (
            <>
                {handlePauseAll && (
                    <Tooltip title="Stop all">
                        <Fab
                            color="secondary"
                            aria-label="stop all"
                            classes={{ root: "bouton" }}
                            onClick={handlePauseAll}
                        >
                            <Icon>pause</Icon>
                        </Fab>
                    </Tooltip>
                )}
                {handleDeleteAll && (
                    <Tooltip title="Delete all">
                        <Fab
                            color="secondary"
                            aria-label="deleteAll"
                            classes={{ root: "bouton" }}
                            onClick={handleDeleteAll}
                        >
                            <Icon>deleteAll</Icon>
                        </Fab>
                    </Tooltip>
                )}
            </>
        )}
        {userPassword ? (
            <Tooltip title={D.getPassword}>
                <Fab
                    color="primary"
                    aria-label={D.getPassword}
                    classes={{ root: "bouton" }}
                    onClick={() => {
                        clipboard.writeText(userPassword);
                        toast(D.passwordCopiedToClipboard, {
                            position: "bottom-left",
                            autoClose: 5000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: false,
                            progress: undefined,
                            type: "info"
                        });
                    }}
                >
                    <VpnKeyIcon />
                </Fab>
            </Tooltip>
        ) : (
            <></>
        )}
    </>
);

export default Toolbar;
