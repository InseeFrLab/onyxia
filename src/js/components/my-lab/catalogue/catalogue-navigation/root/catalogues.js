import React from 'react';
import Grid from '@material-ui/core/Grid';
import Catalogue from '../catalogue.component';
import { axiosPublic, wrapPromise } from 'js/utils';
import api from 'js/redux/api';
import { hasOptedInForBetaTest } from '../../../../../configuration/betatest';

const resource = wrapPromise(axiosPublic(api.catalogue));

const Catalogues = () => {
	const { catalogs } = resource.read();
	const betaTester = hasOptedInForBetaTest();
	return (
		<div className="contenu catalogue">
			<Grid container spacing={2}>
				{catalogs
					.filter((catalogue) => catalogue.status === 'PROD' || betaTester)
					.map((catalogue) => (
						<Catalogue catalogue={catalogue} key={catalogue.id} />
					))}
			</Grid>
		</div>
	);
};

export default Catalogues;
