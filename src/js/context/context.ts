import { prStore } from "js/../libs/setup";
import type { RootState } from "js/../libs/setup";

let user: RootState["user"] = {
	"SSH": {
		"SSH_PUBLIC_KEY": "",
		"SSH_KEY_PASSWORD": ""
	},
	"USERNAME": "",
	"USERMAIL": "",
	"USERKEY": "https://example.com/placeholder.gpg",
	"STATUS": "",
	"GIT": "https://github.com/inseefrlab/onyxia-ui",
	"DNS": "example.com",
	"UUID": "",
	"IP": "",
	"S3": {
		"AWS_DEFAULT_REGION": "us-east-1",
		"AWS_S3_ENDPOINT": "s3.example.com"
	}
};

prStore.then(store=> user = store.getState().user);

export const getContext = () => user;

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
