  
import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import { routes } from "ui/routes";

const Catalogue = ({ catalogue: { id, name, description } }) => (
	<Grid item sm={12} lg={4} classes={{ item: 'carte' }}>
		<Card classes={{ root: 'container' }} className="carte">
			<CardHeader
				title={name}
				classes={{
					root: 'en-tete',
					title: 'titre',
				}}
			/>
			<CardContent>
				<div className="paragraphe">
					<div className="titre">Description</div>
					<div className="corps">{description}</div>
				</div>
			</CardContent>
			<CardActions classes={{ root: 'boutons' }}>

				<a {...routes.catalog({
					"optionalTrailingPath": id
				}).link}>
					<IconButton color="secondary" aria-label="Explorer">
						<Icon>folder_open</Icon>
					</IconButton>
				</a>

			</CardActions>
		</Card>
	</Grid>
);

Catalogue.propTypes = {
	catalogue: PropTypes.shape({
		id: PropTypes.string.isRequired,
	}),
};
export default Catalogue;
