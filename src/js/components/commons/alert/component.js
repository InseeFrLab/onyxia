import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@material-ui/lab/Alert';

const AlertComponent = ({ severity, message }) => (
	<Alert variant="filled" severity={severity}>
		{message}
	</Alert>
);

AlertComponent.propTypes = {
	severity: PropTypes.string,
	message: PropTypes.string.isRequired,
};

AlertComponent.defaultProps = {
	severity: 'success',
};

export default AlertComponent;
