import React from 'react';
import { withKnobs, object, boolean } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from './service.json';
import { MemoryRouter } from 'react-router-dom';
import { muiTheme } from 'storybook-addon-material-ui';
import createTheme from 'js/components/material-ui-theme';

export default {
	title: 'Mylab',
	component: CarteMonService,
	decorators: [
		(getStory) => <MemoryRouter>{getStory()}</MemoryRouter>,
		withKnobs,
		muiTheme(createTheme()),
	],
};

export const WithMinimalData = () => (
	<CarteMonService
		service={object('service', fakeService)}
		wait={boolean('Wait', false)}
	/>
);
