import React from 'react';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from './header-content.component';

export default (props) => (
	<React.Fragment>
		<Header />
		<FilDAriane fil={fil.mesServices} />
		<ListeCartes {...props} />
	</React.Fragment>
);
