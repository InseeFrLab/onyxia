import React from 'react';
import { Typography } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import AsyncCatalogues from './catalogues-async';

const Root = () => (
	<>
		<div className="en-tete">
			<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
				La liste des catalogues disponibles.
			</Typography>
		</div>
		<FilDAriane fil={fil.catalogues} />
		<AsyncCatalogues />
	</>
);

export default Root;
