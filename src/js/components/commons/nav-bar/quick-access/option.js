import React from 'react';
import { Link } from 'react-router-dom';
import IconButton from '@material-ui/core/IconButton';

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

export default Option;
