import React from 'react';
import { Dialog } from "app/atoms/Dialog";
import { DialogTitle, generateIdForLabelledby } from "../atoms/DialogTitle";
import { DialogContent } from "app/atoms/DialogContent";
import { DialogActions } from "app/atoms/DialogActions";
import { Button } from "app/atoms/Button";
import { TextField } from "app/atoms/TextField";
import { symToStr } from "app/utils/symToStr";
import { useTranslation } from "app/i18n/useTranslations";

export type Props = {
  /** [HIGHER ORDER] */
  wordForFile: "file" | "secret";

  createWhat: "directory" | "file";
  callback(params: { doCreate: boolean; }): void;
};

const titleId = generateIdForLabelledby();

export function CreateFileOrDirectoryModal(props: Props) {

  const { wordForFile, createWhat } = props;

  const { t } = useTranslation("CreateFileOrDirectoryModal");

  return (
    <div>
      <Dialog open={open} onClose={handleClose} aria-labelledby={titleId}>
        <DialogTitle
          id={titleId}
          subtitle={(() => {
            switch (createWhat) {
              case "directory": return t("sort out your", { "what": t(wordForFile) })
              case "file": null;
            }
          })()
          }
        >
          {t("create new", { "what": t(createWhat) })}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </div>

  );


}

export declare namespace CreateFileOrDirectoryModal {

  export type I18nScheme = {
    "file": undefined,
    "secret": undefined,
    "directory": undefined,
    'create new': { what: string; };
    'sort out your': { what: string; };
    'name of': { what: string; }
  };

}




/*

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export  function FormDialog() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open form dialog
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To subscribe to this website, please enter your email address here. We will send updates
            occasionally.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
*/