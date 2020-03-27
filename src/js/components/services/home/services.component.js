import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import OngletsAccueil from '../onglets';
import DetailsService from '../details';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';

const Services = ({ serviceSelectionne }) =>
	serviceSelectionne ? (
		<React.Fragment>
			<EnTete />
			<FilDAriane fil={fil.servicesCollaboratifs} />
			<OngletsAccueil />
			<DetailsService />
		</React.Fragment>
	) : (
		<React.Fragment>
			<EnTete />
			<FilDAriane fil={fil.servicesCollaboratifs} />
			<OngletsAccueil />
		</React.Fragment>
	);

Services.propTypes = {
	serviceSelectionne: PropTypes.object,
};

const EnTete = () => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			Applications partagées
		</Typography>
		<Typography variant="h3" align="center" gutterBottom>
			Des applications collaboratives et des services transverses
		</Typography>
	</div>
);

export default Services;
