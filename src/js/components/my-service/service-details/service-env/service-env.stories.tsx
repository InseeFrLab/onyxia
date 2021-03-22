  
import ServiceEnv from './env';
import basicService from 'js/model/sampledata/service-basic.json';

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
