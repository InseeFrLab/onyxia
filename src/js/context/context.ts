import store from '../redux/store';

export const getContext = () => {
	return store.getState().user;
};

const flattenObj = (obj: any, res: any = {}) => {
	for (let key in obj) {
		let propName = key;
		if (typeof obj[key] == 'object') {
			flattenObj(obj[key], res);
		} else {
			res[propName] = obj[key];
		}
	}
	return res;
};

export const searchInContext = (key: string, context: any) => {
	return flattenObj(context)[key];
};
