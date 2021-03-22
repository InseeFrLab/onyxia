  
import ServiceDetails from './details';
import basicService from 'js/model/sampledata/service-basic.json';

export default {
	title: 'My service',
	component: ServiceDetails,
	includeStories: [],
};

export const NoService = () => <ServiceDetails />;

NoService.story = {
	title: 'Basic service',
};

export const BasicServiceDetails = () => (
	<ServiceDetails service={basicService} />
);

BasicServiceDetails.story = {
	title: 'Basic service',
};
