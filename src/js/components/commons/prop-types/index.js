import PropTypes from 'prop-types';

export const serviceType = PropTypes.shape({
	id: PropTypes.string.isRequired,
	cpus: PropTypes.number.isRequired,
	instances: PropTypes.number.isRequired,
	mem: PropTypes.number.isRequired,
	tasksStaged: PropTypes.number.isRequired,
	tasksRunning: PropTypes.number.isRequired,
	tasksHealthy: PropTypes.number.isRequired,
	tasksUnhealthy: PropTypes.number.isRequired,
	labels: PropTypes.shape({
		ONYXIA_TITLE: PropTypes.string.isRequired,
		ONYXIA_SUBTITLE: PropTypes.string.isRequired,
		ONYXIA_LOGO: PropTypes.string,
		ONYXIA_URL: PropTypes.string,
		ONYXIA_PRIVATE_ENDPOINT: PropTypes.string,
	}),
});

export const servicesType = PropTypes.arrayOf(serviceType);

export const groupeType = PropTypes.shape({
	id: PropTypes.string.isRequired,
	apps: servicesType.isRequired,
});

export const userType = {
	idep: PropTypes.string.isRequired,
	nomComplet: PropTypes.string.isRequired,
};

export const groupesType = PropTypes.arrayOf(groupeType);
