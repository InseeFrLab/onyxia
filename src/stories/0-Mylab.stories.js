import React from 'react';
import { withKnobs, object } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from './data/service.json';
import { MemoryRouter } from 'react-router-dom';
import { muiTheme } from 'storybook-addon-material-ui';
import createTheme from 'js/components/material-ui-theme';
import 'js/components/app.scss';
import 'js/components/commons/service-liste/liste-cartes.scss';

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
	<CarteMonService service={object('service', fakeService)} />
);
