import React from 'react';
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Button,
	Divider,
} from '@material-ui/core';
import D from 'js/i18n';
import './login.scss';
import 'js/components/onyxia-modal.scss';
import { prOidcClient } from "lib/setup";
import { assert } from "evt/tools/typeSafety/assert";

class LogMe extends React.Component {
	handleClose = () => {};

	handleLogin = async () => {
		const redirectUri =
			this.props.redirectUri || `${window.location.origin}/accueil`;

		const oidcClient = await prOidcClient;

		assert(!oidcClient.isUserLoggedIn);

		oidcClient.login({ redirectUri });

	};

	render() {
		const { handleClose } = this.props;
		return (
			<Dialog
				fullScreen={false}
				open={this.props.open}
				onClose={handleClose}
				aria-labelledby="login-titre"
				classes={{
					root: 'login-modal',
					paper: 'container',
				}}
			>
				<DialogTitle id="login-titre" classes={{ root: 'en-tete' }}>
					<div className="titre">{D.loginTitle}</div>
					<div className="sous-titre">{D.loginSubtitle}</div>
				</DialogTitle>
				<DialogContent classes={{ root: 'contenu' }}>
					<DialogContentText>
						<Button
							variant="contained"
							color="primary"
							className="bouton-login"
							onClick={this.handleLogin}
						>
							<img
								className="icone-keycloak"
								src="/images/keycloak.png"
								alt="keycloak-logo"
							/>
							{D.authNeeded}
						</Button>
					</DialogContentText>
				</DialogContent>
				<Divider />
				<DialogActions>
					<Button onClick={handleClose} color="primary" autoFocus>
						{D.btnClose}
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default LogMe;
