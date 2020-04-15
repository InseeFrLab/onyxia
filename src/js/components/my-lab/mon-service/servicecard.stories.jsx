import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { object, boolean } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from './service.json';

export default {
	title: 'Service card',
	component: CarteMonService,
	includeStories: [],
};

export const WithProps = () => (
	<CarteMonService
		service={object('service', fakeService)}
		wait={boolean('Wait', false)}
		handleClickLaunch={() => console.log('launch')}
	/>
);

WithProps.story = {
	title: 'WithProps',
};

export const Waiting = () => (
	<CarteMonService
		service={fakeService}
		wait={true}
		handleClickLaunch={() => console.log('launch')}
	/>
);

Waiting.story = {
	title: 'Waiting',
};
