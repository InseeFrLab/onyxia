import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { Fab } from '@material-ui/core';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { IconButton, Icon } from '@material-ui/core/';
import MenuIcon from '@material-ui/icons/Menu';
import AppMenu from './app-menu';
import { LoginModal } from 'js/components/authentication';
import './nav-bar.scss';

class Navbar extends React.Component {
	state = { open: false };
	constructor(props) {
		super(props);
		if (props.authenticated) {
			props.getUserInfo();
		}
	}
	handleClickMenu = (e) => {
		this.setState({ open: true });
	};

	handleClose = () => {
		this.setState({ open: false });
	};

	handleLogout = () => {
		this.props.logout();
	};

	handleLogin = () => {
		this.props.displayLogin(true);
	};

	render() {
		const {
			authenticated,
			redirectUri,
			login,
			screenType,
			startVisite,
		} = this.props;
		return (
			<div className="root">
				<AppBar position="static" color="primary">
					<Toolbar>
						<IconButton
							className="menubutton"
							color="inherit"
							aria-label="Menu"
							onClick={this.handleClickMenu}
						>
							<MenuIcon />
						</IconButton>
						<Link to="/accueil">
							<img
								className="avatar"
								src={isNoel() ? '/onyxia-noel.svg' : '/onyxia.svg'}
								alt="onyxia"
							/>
						</Link>
						<Typography variant="h1" color="inherit" className="flex">
							ONYXIA
						</Typography>

						{authenticated ? (
							<Link to="/mon-compte">
								<LogoMonCompte screenType={screenType} />
							</Link>
						) : (
							<LoginButton
								id="bouton-login"
								screenType={screenType}
								handleClick={this.handleLogin}
							/>
						)}
					</Toolbar>
					<AppMenu
						open={this.state.open}
						authenticated={authenticated}
						login={this.handleLogin}
						logout={this.handleLogout}
						handleClose={this.handleClose}
						startVisite={startVisite}
					/>
					<LoginModal
						open={login}
						redirectUri={redirectUri}
						handleClose={() => {
							this.props.displayLogin(false);
						}}
					/>
				</AppBar>
			</div>
		);
	}
}
const LoginButton = ({ handleClick, screenType }) =>
	screenType === "SMALL" ? (
		<Fab
			id="bouton-login"
			data-testid="bouton-login"
			mini
			onClick={handleClick}
		>
			<Icon className="login-mini">power_settings_new_icon</Icon>
		</Fab>
	) : (
		<Fab
			id="bouton-login"
			data-testid="bouton-login"
			variant="extended"
			aria-label="login"
			onClick={handleClick}
		>
			<Icon className="login">power_settings_new_icon</Icon>
			login
		</Fab>
	);

const LogoMonCompte = ({ screenType }) =>
	screenType === "SMALL" ? (
		<Fab id="bouton-mon-compte" mini>
			<Icon className="bouton-mon-compte-mini">person</Icon>
		</Fab>
	) : (
		<Fab id="bouton-mon-compte" variant="extended" aria-label="logout">
			<Icon className="bouton-mon-compte">person</Icon>
			Mon compte
		</Fab>
	);

const isNoel = () => {
	const m = dayjs();
	const day = m.date();
	const month = m.month();
	if ((month === 11 && day > 15) || (month === 0 && day < 7)) {
		return true;
	}

	return false;
};

export default Navbar;
