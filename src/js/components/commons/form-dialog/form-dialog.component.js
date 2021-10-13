import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

export default function FormDialog({
	title,
	description,
	onOK,
	onNop,
	okText = 'Ok',
	nopText = 'Annuler',
}) {
	const [open, setOpen] = useState(false);
	const [key, setKey] = useState('');
	const [value, setValue] = useState('');

	function handleClickOpen() {
		setOpen(true);
	}

	const handleClose = (result) => () => {
		if (result && onOK) {
			onOK({
				key,
				value,
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
						onChange={(v) => setKey(v.target.value)}
					/>
					<TextField
						margin="dense"
						id="value"
						label="Valeur"
						type="text"
						fullWidth
						onChange={(v) => setValue(v.target.value)}
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
