import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";

export default function FormDialog({
  title,
  description,
  onOK,
  onNop,
  okText = "Ok",
  nopText = "Annuler"
}) {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");

  function handleClickOpen() {
    setOpen(true);
  }

  const handleClose = result => () => {
    if (result && onOK) {
      onOK({
        key,
        value
      });
    }
    if (!result && onNop) {
      onNop();
    }
    setOpen(false);
  };

  return (
    <div>
      <Fab aria-label="delete" onClick={handleClickOpen}>
        <AddIcon />
      </Fab>
      <Dialog
        open={open}
        onClose={handleClose(false)}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{description}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="key"
            label="Clé"
            type="text"
            fullWidth
            onChange={v => setKey(v.target.value)}
          />
          <TextField
            margin="dense"
            id="value"
            label="Valeur"
            type="text"
            fullWidth
            onChange={v => setValue(v.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose(false)} color="primary">
            {nopText}
          </Button>
          <Button onClick={handleClose(true)} color="primary">
            {okText}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
