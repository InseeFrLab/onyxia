import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from './header';
import Service from './service';
import 'js/components/app.scss';
import { withRouter, useParams } from 'react-router-dom';
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";

const MyServiceHome = () => {
	//TODO: Makes sure there is actually a serviceId here
	const { serviceId } = useParams<{ serviceId: string; }>();
	return (
		<LegacyThemeProvider>
			<Header/>
			<FilDAriane fil={fil.myService(serviceId)} />
			<Service serviceId={`/${serviceId}`} />
		</LegacyThemeProvider>
	);
};

export default withRouter(MyServiceHome);
