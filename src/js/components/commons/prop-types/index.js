import PropTypes from 'prop-types';

export const serviceType = PropTypes.shape({
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	logo: PropTypes.string,
	cpus: PropTypes.number.isRequired,
	instances: PropTypes.number.isRequired,
	mem: PropTypes.number.isRequired,
	urls: PropTypes.array.isRequired,
	labels: PropTypes.shape({
		ONYXIA_SUBTITLE: PropTypes.string,
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
