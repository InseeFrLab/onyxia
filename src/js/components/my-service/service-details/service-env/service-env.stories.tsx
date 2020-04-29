import React from 'react';
import ServiceEnv from './env';
import basicService from 'js/model/sampledata/basic-service.json';

export default {
	title: 'My service',
	component: ServiceEnv,
	includeStories: [],
};

const { env } = basicService;

export const BasicServiceEnv = () => <ServiceEnv env={env} />;

BasicServiceEnv.story = {
	title: 'Basic service env',
};
