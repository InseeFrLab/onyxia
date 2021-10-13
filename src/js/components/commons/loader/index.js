  
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import './loader.scss';

const Loader = ({ em }) => (
	<div className="loader">
		<CircularProgress color="primary" size={`${em || 5}em`} />
	</div>
);

Loader.propTypes = {
	em: PropTypes.number,
};

Loader.defaultProps = {
	em: 5,
};

export default Loader;
