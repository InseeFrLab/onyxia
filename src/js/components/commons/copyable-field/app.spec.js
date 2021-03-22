  
import ReactDOM from 'react-dom';
import CopyableField from './index';

it('renders without crashing', () => {
	const div = document.createElement('div');
	ReactDOM.render(<CopyableField value=" " />, div);
	ReactDOM.unmountComponentAtNode(div);
});
