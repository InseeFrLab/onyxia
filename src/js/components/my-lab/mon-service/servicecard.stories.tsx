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
		suivreStatutService={() => console.log('fake')}
		service={object('service', fakeService)}
		wait={boolean('wait', false)}
		handleClickLaunch={() => console.log('launch')}
	/>
);

BasicService.story = {
	title: 'WithProps',
};

export const CompleteService = () => (
	<CarteMonService
		suivreStatutService={() => console.log('fake')}
		service={object('service', completeService)}
		wait={boolean('wait', false)}
		handleClickLaunch={() => console.log('launch')}
	/>
);

CompleteService.story = {
	title: 'Complete',
};

export const Waiting = () => (
	<CarteMonService
		suivreStatutService={() => console.log('fake')}
		service={fakeService}
		wait={true}
		handleClickLaunch={() => console.log('launch')}
	/>
);

Waiting.story = {
	title: 'Waiting',
};
