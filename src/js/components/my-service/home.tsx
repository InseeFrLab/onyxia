import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from './header';
import Service from './service';
import 'js/components/app.scss';
import { withRouter, useParams } from 'react-router-dom';

const MyServiceHome = () => {
	//TODO: Makes sure there is actually a serviceId here
	const { serviceId } = useParams<{ serviceId: string; }>();
	return (
		<>
			<Header/>
			<FilDAriane fil={fil.myService(serviceId)} />
			<Service serviceId={`/${serviceId}`} />
		</>
	);
};

export default withRouter(MyServiceHome);
