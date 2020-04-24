import React from 'react';
import { object, boolean } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from 'js/model/sampledata/basic-service.json';
import completeService from 'js/model/sampledata/complete-service.json';

export default {
	title: 'Service card',
	component: CarteMonService,
	includeStories: [],
};

export const BasicService = () => (
	<CarteMonService
		service={object('service', fakeService)}
		handleClickLaunch={() => console.log('launch')}
	/>
);

BasicService.story = {
	title: 'WithProps',
};

export const CompleteService = () => (
	<CarteMonService
		service={object('service', completeService)}
		handleClickLaunch={() => console.log('launch')}
	/>
);

CompleteService.story = {
	title: 'Complete',
};

export const Waiting = () => (
	<CarteMonService
		service={fakeService}
		handleClickLaunch={() => console.log('launch')}
	/>
);

Waiting.story = {
	title: 'Waiting',
};
