import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import createAiguilleur from 'js/components/commons/variable-location';
import Leaf from './mes-secrets-leaf.component';
import Node from './mes-secrets-node.component';
import Loader from 'js/components/commons/loader';
import './mes-secrets.scss';

const isLeaf = async ({ pathname, search }) => {
	const tokens = pathname.split('/').filter((f) => f.length > 0);
	const isPath = tokens.length > 2 && search.indexOf('path=true') === -1;
	return Promise.resolve(isPath);
};

const Aiguilleur = createAiguilleur({
	leaf: Leaf,
	node: Node,
	isLeaf,
});

class MesSecrets extends React.Component {
	state = {
		init: false,
		vaultSecretInit: false,
		location: undefined,
	};

	constructor(props) {
		super(props);
		if (!props.user) {
			props.getUserInfo();
		}
	}

	static getDerivedStateFromProps = (
		{ user, vaultSecretsList, ...props },
		state
	) => {
		const search = `${window.location.pathname}${window.location.search}`;

		if (!state.init) {
			props.checkVaultStatus();
			return { ...state, init: true };
		}
		if (
			props.sealedStatus === "VAULT_STATUS_UNSEALED" &&
			state.location !== search &&
			user
		) {
			isLeaf(window.location).then((is) => {
				if (!is) {
					props.getVaultSecretsList(
						props.match.url.replace('/mes-secrets', '')
					);
				} else {
					props.getVaultSecret(props.match.url.replace('/mes-secrets', ''));
				}
			});

			return { ...state, location: search };
		}
		if (state.vaultSecretsList !== props.vaultSecretsList) {
			return {
				...state,
				vaultSecretsList,
			};
		}
		return state;
	};

	render() {
		const { sealedStatus } = this.props;
		if (sealedStatus === "VAULT_STATUS_UNKNOWN") return <Loader em={18} />;
		return sealedStatus === "VAULT_STATUS_SEALED" ? (
			<>
				<SealedChest {...this.props} />
			</>
		) : (
			<>
				<Aiguilleur {...this.props} />
			</>
		);
	}
}

const SealedChest = ({ location }) => (
	<>
		<div className="en-tete">
			<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
				Mes secrets
			</Typography>
		</div>
		<FilDAriane fil={fil.mesSecrets(location)} />

		<div className="contenu mes-secrets">
			<Paper className="paragraphe" elevation={1}>
				<Typography variant="h3" align="left" color="textPrimary" gutterBottom>
					Le coffre est scellé !
				</Typography>
			</Paper>
		</div>
	</>
);

export default MesSecrets;
