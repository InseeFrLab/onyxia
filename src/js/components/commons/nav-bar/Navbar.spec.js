  
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from 'js/redux/legacyActions';

describe('nav-bar component', () => {
	it('shoud call the handleClickMenu after clicking to the button', () => {
		const { getByLabelText, getByTestId } = render(
			<MemoryRouter>
				<Provider store={store}>
					<Navbar login={false} displayLogin={jest.fn} />
				</Provider>
			</MemoryRouter>
		);
		fireEvent.click(getByLabelText('Menu'));
		fireEvent.click(getByTestId('bouton-login'));
	});
});
