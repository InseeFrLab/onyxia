import { getContext, searchInContext } from 'js/context/context';

export const getDefaultSingleOption = (property, context = getContext()) => {
	if (property['api-defined']) {
		return property['api-default'].replace(
			/\[\$(.*)\]/g,
			(_, key) => searchInContext(key, context) || property['api-default']
		);
	}

	return property['default'];
};
