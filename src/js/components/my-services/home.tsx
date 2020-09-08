import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/header';
import Services from './services';
import 'js/components/app.scss';
import { withRouter, useParams } from 'react-router-dom';

const MyServicesHome = () => {
	//TODO: Make sure groupId exists in URL params.
	const { groupId } = useParams<{ groupId: string; }>();
	return (
		<>
			<Header />
			<FilDAriane fil={fil.myServices(groupId)} />
			<Services groupId={groupId} />
		</>
	);
};

export default withRouter(MyServicesHome);
