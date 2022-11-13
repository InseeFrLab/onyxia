import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Catalogue from '../catalogue.component';
import { restApiPaths } from 'js/restApiPaths';
import { useIsBetaModeEnabled } from "core";
import { prAxiosInstance } from "core/adapters/officialOnyxiaApiClient";

const Catalogues = () => {
	const [catalogs, setCatalogs] = useState([]);
	const { isBetaModeEnabled } = useIsBetaModeEnabled();

	useEffect(() => {

		(async () => {

			(await prAxiosInstance)(restApiPaths.catalogue)
				.then(({ data }) => data)
				.then((resp) => setCatalogs(resp.catalogs));

		})();

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
