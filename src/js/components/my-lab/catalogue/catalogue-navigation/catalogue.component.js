  
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import { routes } from "app/routes/router";

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
