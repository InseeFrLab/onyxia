import { useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import Option from './option';
import { IconButton, Icon } from '@material-ui/core/';
import {
	CatalogueIcon,
	BecherIcon,
	PokerHandIcon,
} from 'js/components/commons/icons';

const QuickAccess = ({ location: { pathname } }) => {
	const [folded, setFolded] = useState(false);
	return (
		<div className="acces-rapide">
			<Paper classes={{ root: 'paper' }} elevation={1}>
				<IconButton
					aria-label="less"
					className="bouton"
					onClick={() => setFolded(!folded)}
				>
					<Icon className="fold">
						{folded ? 'chevron_left' : 'chevron_right'}
					</Icon>
				</IconButton>
				{folded ? null : (
					<>
						<Option
							icone={PokerHandIcon}
							label="Services"
							path="/services"
							focused={pathname === '/services'}
						/>
						<Option
							icone={BecherIcon}
							label="mon-labo"
							path="/my-services"
							focused={pathname === '/my-services'}
						/>
						<Option
							icone={CatalogueIcon}
							label="catalogue"
							path="/my-lab/catalogue"
							focused={pathname === '/my-lab/catalogue'}
						/>
						<Option
							icone={({ style }) => <Icon style={style}>folder</Icon>}
							label="mes fichiers"
							path="/mes-fichiers"
							focused={pathname === '/mes-fichiers'}
						/>
					</>
				)}
			</Paper>
		</div>
	);
};

QuickAccess.propTypes = {
	location: PropTypes.shape({ pathname: PropTypes.string.isRequired })
		.isRequired,
};

export default withRouter(QuickAccess);
