import React, { useState } from 'react';
import { Service } from 'js/model';
import Loader from '../commons/loader';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import ServiceConf from './service-conf';

interface Props {
	service?: Service;
}
const ServiceDetails = ({ service }: Props) => {
	const [activeTab, setActiveTab] = useState(0);

	return service ? (
		<>
			<AppBar position="static">
				<Tabs
					aria-label="tabs"
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
				>
					<Tab label="Configuration" />
					<Tab label="Tâches" />
					<Tab label="Debug" />
				</Tabs>
			</AppBar>
			{activeTab === 0 ? <ServiceConf service={service}></ServiceConf> : <></>}
		</>
	) : (
		<Loader />
	);
};
export default ServiceDetails;
