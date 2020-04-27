import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from './header';
import Service from './service';
import 'js/components/app.scss';
import { withRouter, useParams } from 'react-router-dom';

const MyServiceHome = () => {
	const { serviceId } = useParams();
	return (
		<>
			<Header serviceId={serviceId} />
			<FilDAriane fil={fil.myService} />
			<Service serviceId={`/${serviceId}`} />
		</>
	);
};

export default withRouter(MyServiceHome);
