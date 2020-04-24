import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/header';
import Services from './services';
import 'js/components/app.scss';

const MyServicesHome = () => {
	return (
		<>
			<Header />
			<FilDAriane fil={fil.mesServices} />
			<Services />
		</>
	);
};

export default MyServicesHome;
