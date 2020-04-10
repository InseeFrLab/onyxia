import React from 'react';
import { Typography, Button } from '@material-ui/core/';
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from '@material-ui/core';
import 'js/components/onyxia-modal.scss';
import { WarnIcon } from 'js/components/commons/icons';

export default ({ open, toggle, action, title, body }) => (
	<Dialog
		fullScreen={false}
		open={open}
		onClose={toggle}
		aria-labelledby="login-titre"
		classes={{
			root: 'login-modal',
			paper: 'container',
		}}
	>
		<DialogTitle id="login-titre" classes={{ root: 'en-tete' }}>
			<div className="titre">{title}</div>
			<div className="sous-titre">Attention !</div>
		</DialogTitle>
		<DialogContent classes={{ root: 'contenu' }}>
			<div className="paragraphe">
				<div className="corps">
					<Typography variant="body1" gutterBottom>
						<strong>{body}</strong>
					</Typography>
					<Typography variant="body2" gutterBottom>
						<span style={{ float: 'left' }}>
							<WarnIcon />
						</span>
						Attention, cette action implique la perte de toutes les données
						associées au service !
					</Typography>
				</div>
			</div>
		</DialogContent>

		<DialogActions>
			<Button
				title="valider"
				color="primary"
				variant="contained"
				className="bouton-login"
				onClick={action}
			>
				Valider
			</Button>
			<Button
				variant="contained"
				onClick={toggle}
				color="secondary"
				autoFocus
				title="annuler"
			>
				Annuler
			</Button>
		</DialogActions>
	</Dialog>
);
