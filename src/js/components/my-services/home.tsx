import React from 'react';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/parts/header-content.component';

const MyServicesHome = () => (
	<>
		<Header />
		<FilDAriane fil={fil.mesServices} />
		<ListeCartes services={[]} groupes={[]} />
	</>
);

export default MyServicesHome;
