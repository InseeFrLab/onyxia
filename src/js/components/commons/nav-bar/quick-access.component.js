import React from 'react';
import Paper from '@material-ui/core/Paper';
import { Link } from 'react-router-dom';
import { IconButton, Icon } from '@material-ui/core/';
import {
	CatalogueIcon,
	BecherIcon,
	PokerHandIcon,
} from 'js/components/commons/icons';

class QuickAccess extends React.Component {
	state = { focused: 0, folded: false };
	toggleFolded = () => this.setState({ folded: !this.state.folded });
	render() {
		const { pathname } = window.location;

		return (
			<div className="acces-rapide">
				<Paper classes={{ root: 'paper' }} elevation={1}>
					<IconButton
						aria-label="less"
						className="bouton"
						onClick={this.toggleFolded}
					>
						<Icon className="fold">
							{this.state.folded ? 'chevron_left' : 'chevron_right'}
						</Icon>
					</IconButton>
					{this.state.folded ? null : (
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
								path="/my-lab/mes-services"
								focused={pathname === '/my-lab/mes-services'}
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
	}
}

const Option = ({
	width = 20,
	height = 20,
	icone: Icone,
	label,
	path = '/accueil',
	focused = false,
}) => (
	<span className={`lien ${focused ? 'focused' : ''}`}>
		<Link to={path}>
			<IconButton aria-label={label} disabled={focused} title={label}>
				<Icone
					style={{ color: focused ? '#fb8c00' : 'snow', fontSize: '20px' }}
					width={width}
					height={height}
					color={focused ? '#fb8c00' : 'snow'}
				/>
			</IconButton>
		</Link>
	</span>
);

export default QuickAccess;
