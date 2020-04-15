import React from 'react';
import { Link } from 'react-router-dom';
import {
	IconButton,
	Drawer,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Icon,
} from '@material-ui/core/';
import { Clear, Home } from '@material-ui/icons';
import {
	BecherIcon,
	CatalogueIcon,
	PokerHandIcon,
} from 'js/components/commons/icons';

import { hasOptedInForBetaTest } from '../../../configuration/betatest';

const ItemLogin = ({ login }) => (
	<ListItem button onClick={login}>
		<ListItemIcon>
			<Icon className="login" style={{ color: 'forestgreen' }}>
				power_settings_new_icon
			</Icon>
		</ListItemIcon>
		<ListItemText primary="Login" />
	</ListItem>
);

/*const ItemLogout = ({ logout }) => (
  <ListItem button onClick={logout}>
    <ListItemIcon>
      <Icon className="login" style={{ color: "crimson" }}>
        power_settings_new_icon
      </Icon>
    </ListItemIcon>
    <ListItemText primary="logout" />
  </ListItem>
);*/

export default ({
	open,
	handleClose,
	authenticated,
	login,
	logout,
	startVisite,
}) => (
	<Drawer anchor="left" open={open} onClose={handleClose}>
		<div className="menu" tabIndex={0}>
			<IconButton onClick={handleClose}>
				<Clear />
			</IconButton>
			<List onClick={handleClose}>
				{authenticated ? null : <ItemLogin login={login} />}
				<ListItem button component={Link} to="/accueil">
					<ListItemIcon>
						<Home />
					</ListItemIcon>
					<ListItemText primary="Accueil" />
				</ListItem>
				<ListItem button component={Link} to="/visite-guidee">
					<ListItemIcon>
						<Icon>forward</Icon>
					</ListItemIcon>
					<ListItemText primary="Visite guidée" />
				</ListItem>
				<ListItem>
					<ListItemText primary="La plateforme" />
				</ListItem>
				<ListItem button component={Link} to="/services">
					<ListItemIcon>
						<PokerHandIcon width={30} height={30} />
					</ListItemIcon>
					<ListItemText primary="Services" />
				</ListItem>
				<ListItem>
					<ListItemText primary="Services à la demande" />
				</ListItem>
				<ListItem button component={Link} to="/my-lab/catalogue">
					<ListItemIcon>
						<CatalogueIcon width={20} height={20} />
					</ListItemIcon>
					<ListItemText primary="Catalogue" />
				</ListItem>
				<ListItem button component={Link} to="/my-lab/mes-services">
					<ListItemIcon>
						<BecherIcon height={20} width={20} />
					</ListItemIcon>
					<ListItemText primary="Mon Labo" />
				</ListItem>
				<ListItem>
					<ListItemText primary="Données" />
				</ListItem>
				<ListItem button component={Link} to="/mes-fichiers">
					<ListItemIcon>
						<Icon>folder</Icon>
					</ListItemIcon>
					<ListItemText primary="Mes fichiers" />
				</ListItem>
				{hasOptedInForBetaTest() ? (
					<ListItem button component={Link} to="/mes-secrets">
						<ListItemIcon>
							<Icon>vpn_key</Icon>
						</ListItemIcon>
						<ListItemText primary="Mes secrets" />
					</ListItem>
				) : null}
			</List>
		</div>
	</Drawer>
);
