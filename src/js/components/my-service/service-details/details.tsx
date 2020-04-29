import React, { useState } from 'react';
import { Service } from 'js/model';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import ServiceConf from './service-conf';
import ServiceTasks from './service-tasks';
import D from 'js/i18n';

interface Props {
	service?: Service;
}

const TAB_CONFIGURATION = 0;
const TAB_TASKS = 1;
//const TAB_DEBUG = 2;

const ServiceDetails = ({ service }: Props) => {
	const [activeTab, setActiveTab] = useState(TAB_CONFIGURATION);

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
			{activeTab === TAB_CONFIGURATION && (
				<ServiceConf service={service}></ServiceConf>
			)}
			{activeTab === TAB_TASKS && (
				<ServiceTasks
					serviceId={service.id}
					serviceType={service.type}
					tasks={service.tasks}
				/>
			)}
		</>
	) : (
		<div>{D.serviceNotFound}</div>
	);
};
export default ServiceDetails;
