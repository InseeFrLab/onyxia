import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Prec, LinkTo } from './../vignette-commons';
import { CatalogueIcon } from 'js/components/commons/icons';
import D from 'js/i18n';
import { routes } from "app/router";

 
export default {
	description: () => {
		//document.getElementById('onglets-accueil-services').style.zIndex = 99999;
		//document.getElementById('onglets-accueil-services').style.outline =
		//	'1px solid red';
		return (
			<>
				<Typography variant="h6" gutterBottom>
					{D.guidedTourSharedServicesTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette3Text1}
				</Typography>
				<Typography variant="body1" gutterBottom>
					{D.guidedTourVignette3Text2}
				</Typography>
			</>
		);
	},
	actions: ({ next, prec }) => (
		<>
			<Prec prec={prec} />
			<LinkTo
				anchorProps={routes.catalog({}).link}
				onClick={next}
				title={D.btnSelfServiceCatalog}
				component={() => <CatalogueIcon width={20} height={20} color="#fff" />}
			/>
		</>
	),
};
