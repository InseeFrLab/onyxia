import React from 'react';
import ServiceConf from './conf';
import basicService from 'js/model/sampledata/service-basic.json';

export default {
	title: 'My service',
	component: ServiceConf,
	includeStories: [],
};

export const BasicServiceConf = () => <ServiceConf service={basicService} />;

BasicServiceConf.story = {
	title: 'Basic service conf',
};
