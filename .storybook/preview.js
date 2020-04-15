import React from 'react';
import { MemoryRouter } from 'react-router';
import { addDecorator } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { muiTheme } from 'storybook-addon-material-ui';
import createTheme from 'js/components/material-ui-theme';

addDecorator(withKnobs);
addDecorator(muiTheme(createTheme()));

addDecorator((story) => (
	<MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>
));
