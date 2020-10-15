
import type { Region } from "../Region";

export const regionWithLocation: Region = {
	"id": "datalab",
	"name": "DG Insee",
	"description": "A region with location data",
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
		"lat": 48.8164,
		"long": 2.3174,
		"name": "Montrouge (France)"
	}
}
