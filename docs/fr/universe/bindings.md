# Bindings

Liste des valeurs injectables dans les contrats universe :

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
		"KUB_SERVER_NAME": "",
		"KUB_SERVER_URL": ""
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

Une value universe peut donc par exemple être : `{{git.mail}}`
