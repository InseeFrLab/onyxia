import React from 'react';
import ServiceTasks from './tasks';
import basicService from 'js/model/sampledata/basic-service.json';

export default {
	title: 'My service',
	component: ServiceTasks,
	includeStories: [],
};

export const BasicServiceTasks = () => <ServiceTasks service={basicService} />;

BasicServiceTasks.story = {
	title: 'Basic service tasks',
};
