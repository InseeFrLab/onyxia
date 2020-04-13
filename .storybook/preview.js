import React from 'react';
import { addDecorator } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { MemoryRouter } from 'react-router-dom';
import { muiTheme } from 'storybook-addon-material-ui';
import createTheme from 'js/components/material-ui-theme';

addDecorator(withKnobs);
addDecorator(muiTheme(createTheme()));
addDecorator((getStory) => <MemoryRouter>{getStory()}</MemoryRouter>);
