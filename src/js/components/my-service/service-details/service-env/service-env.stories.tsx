import React from 'react';
import ServiceEnv from './env';
import basicService from 'js/model/sampledata/basic-service.json';

export default {
	title: 'My service',
	component: ServiceEnv,
	includeStories: [],
};

export const BasicServiceEnv = () => <ServiceEnv service={basicService} />;

BasicServiceEnv.story = {
	title: 'Basic service env',
};
