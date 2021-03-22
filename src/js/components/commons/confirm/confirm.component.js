  
import { Dialog, DialogActions, DialogContent } from '@material-ui/core';
import { DialogTitle, Button } from '@material-ui/core';
import PropTypes from 'prop-types';

class Confirm extends React.Component {
	render() {
		const { display, cancel, titre, sousTitre, children, confirm } = this.props;

		return (
			<Dialog
				fullScreen={false}
				open={display}
				onClose={cancel}
				aria-labelledby="login-titre"
				classes={{
					root: 'login-modal',
					paper: 'container',
				}}
			>
				<DialogTitle id="login-titre" classes={{ root: 'en-tete' }}>
					<div className="titre">{titre}</div>
					{sousTitre ? <div className="sous-titre">{sousTitre}</div> : null}
				</DialogTitle>
				<DialogContent classes={{ root: 'contenu' }}>
					{children}
					<DialogActions>
						<Button variant="contained" color="primary" onClick={confirm}>
							Accepter
						</Button>
						<Button onClick={cancel} autoFocus>
							Annuler
						</Button>
					</DialogActions>
				</DialogContent>
			</Dialog>
		);
	}
}

Confirm.propTypes = {
	display: PropTypes.bool.isRequired,
	titre: PropTypes.string.isRequired,
	sousTitre: PropTypes.string,
	confirm: PropTypes.func.isRequired,
	cancel: PropTypes.func.isRequired,
};

export default Confirm;
