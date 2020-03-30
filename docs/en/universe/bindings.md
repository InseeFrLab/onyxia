# Bindings

Avaiable values for universe contracts:

```json
{
	"user": {
		"idep": "My idep",
		"name": "My name",
		"email": "My email",
		"password": "",
		"key": ""
	},
	"git": { "name": "My name", "email": "My email" },
	"status": "",
	"dns": "",
	"keycloak": {
		"KC_ID_TOKEN": "",
		"KC_REFRESH_TOKEN": "",
		"KC_ACCESS_TOKEN": ""
	},
	"kubernetes": {
		"KUB_KC_CLIENT_ID": "",
		"KUB_KC_URL": "",
		"KUB_APISERVER_URL": ""
	},
	"vault": { "VAULT_ADDR": "", "VAULT_TOKEN": undefined },
	"s3": {
		"accessKey": "",
		"secretAccessKey": "",
		"sessionToken": "",
		"expiration": ""
	}
}
```

An universe value could be: `{{git.mail}}`
