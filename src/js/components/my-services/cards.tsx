import React from 'react';
import { Grid } from '@material-ui/core/';
import { CarteMonService } from 'js/components/commons/service-liste';
import { Service } from 'js/model';

interface Props {
	services: Service[];
}

const Cards = ({ services }: Props) => (
	<Grid container spacing={8} classes={{ container: 'cartes' }}>
		{services.map((service, i) => (
			<CarteMonService key={i} service={service} />
		))}
	</Grid>
);

export default Cards;
