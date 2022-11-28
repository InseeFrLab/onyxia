import { Typography, Button } from "@mui/material/";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { WarnIcon } from "js/components/commons/icons";
import D from "js/i18n";
import "js/components/onyxia-modal.scss";

interface Props {
    open: boolean;
    title: string;
    subtitle?: string;
    body?: string;
    warn?: string;
    onValid: () => void;
    onCancel: () => void;
}

const DialogConfirm = ({
    open,
    title,
    subtitle,
    body,
    warn,
    onValid,
    onCancel
}: Props) => (
    <Dialog
        fullScreen={false}
        open={open}
        onClose={onCancel}
        aria-labelledby="login-titre"
        classes={{
            root: "login-modal",
            paper: "container"
        }}
    >
        <DialogTitle id="login-titre" classes={{ root: "en-tete" }}>
            <div className="titre">{title}</div>
            <div className="sous-titre">{subtitle}</div>
        </DialogTitle>
        <DialogContent classes={{ root: "contenu" }}>
            <div className="paragraphe">
                <div className="corps">
                    <Typography variant="body1" gutterBottom>
                        <strong>{body}</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        <span style={{ float: "left" }}>
                            <WarnIcon />
                        </span>
                        {warn}
                    </Typography>
                </div>
            </div>
        </DialogContent>
        <DialogActions>
            <Button title="valider" color="primary" variant="contained" onClick={onValid}>
                {D.btnValid}
            </Button>
            <Button
                title="cancel"
                color="secondary"
                variant="contained"
                onClick={onCancel}
            >
                {D.btnCancel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default DialogConfirm;
