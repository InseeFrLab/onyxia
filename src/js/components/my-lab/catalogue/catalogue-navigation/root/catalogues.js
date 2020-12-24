import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Catalogue from '../catalogue.component';
import { axiosPublic } from "js/utils/axios-config";
import { restApiPaths } from 'js/restApiPaths';
import { useIsBetaModeEnabled } from "app/lib/hooks";

const Catalogues = () => {
	const [catalogs, setCatalogs] = useState([]);
	const { isBetaModeEnabled } = useIsBetaModeEnabled();

	useEffect(() => {
		axiosPublic(restApiPaths.catalogue).then((resp) => {
			setCatalogs(resp.catalogs);
		});
	}, []);

	return (
		<div className="contenu catalogue">
			<Grid container spacing={2}>
				{catalogs
					.filter((catalogue) => catalogue.status === 'PROD' || isBetaModeEnabled)
					.map((catalogue) => (
						<Catalogue catalogue={catalogue} key={catalogue.id} />
					))}
			</Grid>
		</div>
	);
};

export default Catalogues;
