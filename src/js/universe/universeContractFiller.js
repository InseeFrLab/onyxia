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

const getDefaultOptions = (properties, context = getContext()) => {
	return Object.entries(properties).reduce((acc, [category, v]) => {
		const laData = Object.entries(v.properties).reduce(
			(categoryData, [propName, propData]) => {
				const { type } = propData;
				const jsControl = propData['js-control'];
				if (jsControl === 'shadow' || !type) {
					return categoryData;
				}

				categoryData[propName] = getDefaultSingleOption(propData, context);

				return categoryData;
			},
			{}
		);

		if (Object.keys(laData).length > 0) {
			acc[category] = laData;
		}

		return acc;
	}, {});
};

export default getDefaultOptions;
