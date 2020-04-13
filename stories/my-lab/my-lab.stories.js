import React from 'react';
import { object, boolean } from '@storybook/addon-knobs';
import CarteMonService from 'js/components/commons/service-liste/carte-mon-service';
import fakeService from './service.json';

export default {
	title: 'Mylab',
	component: CarteMonService,
};

export const WithMinimalData = () => (
	<CarteMonService
		service={object('service', fakeService)}
		wait={boolean('Wait', false)}
	/>
);
