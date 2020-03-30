import Mustache from 'mustache';

export const getFieldSafeAttr = (field) => {
	const media = (field.media && field.media.type && field.media.type) || '';
	return !field['x-form']
		? { ...field, hidden: true, media }
		: { ...field, ...field['x-form'], media };
};

const formatUser = (user) => ({
	user: {
		idep: user.IDEP,
		name: user.USERNAME,
		email: user.USERMAIL,
		password: user.USERPASSWORD,
		key: user.USERKEY,
		ip: user.IP,
	},
	git: {
		name: user.USERNAME,
		email: user.USERMAIL,
	},
	status: user.STATUS,
	dns: user.DNS,
	keycloak: { ...user.KEYCLOAK },
	kubernetes: { ...user.KUBERNETES },
	vault: { ...user.VAULT },
	s3: { ...user.minio },
});

export const fromUser = (user) => (field) => {
	if (!field['x-form'] || !field['x-form'].value) return '';
	const { value } = field['x-form'];
	const formattedUser = formatUser(user);
	return Mustache.render(value, formattedUser);
};

export const filterOnglets = (onglets) =>
	onglets.filter(
		({ fields }) =>
			fields.filter(({ field }) => !field['x-form'] || field['x-form'].hidden)
				.length > 0
	);
