import React from 'react';
import { Grid } from '@material-ui/core/';
import {
	CarteMonService,
	CarteMonGroupe,
} from 'js/components/commons/service-liste';
import { Service, Group } from 'js/model';

interface Props {
	services: Service[];
	groups: Group[];
}

const Cards = ({ services, groups }: Props) => (
	<Grid container spacing={8} classes={{ container: 'cartes' }}>
		{services &&
			services.map((service, i) => (
				<CarteMonService key={i} service={service} />
			))}
		{groups &&
			groups.map((group, i) => <CarteMonGroupe key={i} group={group} />)}
	</Grid>
);

export default Cards;
