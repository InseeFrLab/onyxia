import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/header';
import Services from './services';
import 'js/components/app.scss';
import { withRouter, useParams } from 'react-router-dom';

const MyServicesHome = () => {
	const { groupId } = useParams();
	return (
		<>
			<Header />
			<FilDAriane fil={fil.myServices} />
			<Services groupId={groupId} />
		</>
	);
};

export default withRouter(MyServicesHome);
