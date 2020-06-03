import React from 'react';
import ServiceTasks from './tasks';
import basicService from 'js/model/sampledata/service-basic.json';

export default {
	title: 'My service',
	component: ServiceTasks,
	includeStories: [],
};

const { id, type, tasks } = basicService;

export const BasicServiceTasks = () => (
	<ServiceTasks serviceId={id} serviceType={type} tasks={tasks} />
);

BasicServiceTasks.story = {
	title: 'Basic service tasks',
};
