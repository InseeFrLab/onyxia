import Mustache from 'mustache';

// Disable mustache html escaping
Mustache.escape = function (text) {
	return text;
};

export const getFieldSafeAttr = (field) => {
	const media = (field.media && field.media.type && field.media.type) || '';
	return !field['x-form']
		? { ...field, hidden: false, media }
		: { ...field, ...field['x-form'], media };
};

const formatUser = (user) => ({
	user: {
		idep: user.IDEP,
		name: user.USERNAME,
		email: user.USERMAIL,
		password: (user.VAULT && user.VAULT.DATA && user.VAULT.DATA.password) || '',
		key: user.USERKEY,
		ip: user.IP,
	},
	git: {
		name:
			(user.VAULT && user.VAULT.DATA && user.VAULT.DATA.git_user_name) || '',
		email:
			(user.VAULT && user.VAULT.DATA && user.VAULT.DATA.git_user_mail) || '',
		credentials_cache_duration:
			(user.VAULT &&
				user.VAULT.DATA &&
				user.VAULT.DATA.git_credentials_cache_duration) ||
			'0',
	},
	status: user.STATUS,
	dns: user.DNS,
	keycloak: { ...user.KEYCLOAK },
	kubernetes: { ...user.KUBERNETES },
	vault: { ...user.VAULT },
	s3: { ...user.S3 },
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
			fields.filter(({ field }) => !field['x-form'] || !field['x-form'].hidden)
				.length > 0
	);
