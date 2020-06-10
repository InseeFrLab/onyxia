import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Catalogue from '../catalogue.component';
import { axiosPublic } from 'js/utils';
import api from 'js/redux/api';
import useBetaTest from 'js/components/hooks/useBetaTest';

const Catalogues = () => {
	const [catalogs, setCatalogs] = useState([]);
	const [betaTester] = useBetaTest();

	useEffect(() => {
		axiosPublic(api.catalogue).then((resp) => {
			setCatalogs(resp.catalogs);
		});
	}, []);

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
