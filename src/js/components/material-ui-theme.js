import { createMuiTheme } from '@material-ui/core/styles';

export default () =>
	createMuiTheme({
		typography: {
			useNextVariants: true,
			fontSize: 14,
		},
		palette: {
			primary: {
				light: '#8d98f2',
				main: '#5c6bc0',
				dark: '#23408e',
				contrastText: '#fff',
			},
			secondary: {
				light: '#ff7961',
				main: '#fb8c00',
				dark: '#ba000d',
				contrastText: '#000',
			},
		},
	});
