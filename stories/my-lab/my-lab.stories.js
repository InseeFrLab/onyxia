import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { object, boolean } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from './service.json';

export default {
	title: 'MyLab',
	component: CarteMonService,
	includeStories: [],
};

export const WithProps = () => (
	<MemoryRouter>
		<CarteMonService
			service={object('service', fakeService)}
			wait={boolean('Wait', false)}
			handleClickLaunch={() => console.log('launch')}
		/>
	</MemoryRouter>
);

WithProps.story = {
	title: 'WithProps',
};

export const Waiting = () => (
	<MemoryRouter>
		<CarteMonService
			service={fakeService}
			wait={true}
			handleClickLaunch={() => console.log('launch')}
		/>
	</MemoryRouter>
);

Waiting.story = {
	title: 'Waiting',
};
