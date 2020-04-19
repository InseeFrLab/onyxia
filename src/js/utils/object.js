export const objDiff = (reference) => (compare) => {
	if (!reference || Object.keys(reference).length === 0) return compare || {};
	return Object.entries(reference).reduce((acc, [key, value]) => {
		if (compare[key] === value) return acc;
		return { ...acc, [key]: value };
	}, {});
};

export const buildParamsFromObj = (obj) => {
	if (!obj || obj !== Object(obj)) return '';
	return Object.entries(obj)
		.reduce((acc, [key, value]) => `${acc}&${key}=${value}`, '')
		.slice(1);
};
