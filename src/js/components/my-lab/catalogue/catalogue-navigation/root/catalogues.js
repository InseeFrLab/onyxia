import React from 'react';
import Grid from '@material-ui/core/Grid';
import Catalogue from '../catalogue.component';
import { axiosPublic, wrapPromise } from 'js/utils';
import api from 'js/redux/api';

const resource = wrapPromise(axiosPublic(api.catalogue));

const Catalogues = () => {
	const { universes } = resource.read();
	return (
		<div className="contenu catalogue">
			<Grid container spacing={2}>
				{universes
					.filter((catalogue) => catalogue.status === 'PROD')
					.map((catalogue) => (
						<Catalogue catalogue={catalogue} key={catalogue.id} />
					))}
			</Grid>
		</div>
	);
};

export default Catalogues;
