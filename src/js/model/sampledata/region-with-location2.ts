import type { Region } from "../Region";

export const regionWithLocation2: Region = {
	"id": "datalab",
	"name": "DG Insee",
	"description": "A second region with location data",
	"services": {
		"type": "MARATHON",
		"namespacePrefix": "users",
		"marathonDnsSuffix": "marathon.containerip.dcos.thisdcos.directory",
		"expose": {
			"domain": "apps.example.com"
		},
		"monitoring": {
			"URLPattern": "https://graphana.example.com/$appIdSlug"
		},
		"cloudshell": {
			"catalogId": "internal",
			"packageName": "shelly"
		}
	},
	"data": {
		"S3": {
			"URL": "minio.example.com"
		}
	},
	"location": {
		"name": "St. Ghislain (Belgium)",
		"lat": 50.8503,
		"long": 4.3517
	}
}
