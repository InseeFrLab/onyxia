import type { Region } from "../Region";

export const regionWithLocation2: Region = {
    "id": "datalab",
    "name": "DG Insee",
    "description": "A second region with location data",
    "services": {
        "type": "MARATHON",
        "defaultIpProtection": true,
        "network": "calico",
        "namespacePrefix": "users",
        "marathonDnsSuffix": "marathon.containerip.dcos.thisdcos.directory",
        "expose": {
            "domain": "lab.sspcloud.fr"
        },
        "monitoring": {
            "URLPattern":
                "https://grafana.lab.sspcloud.fr/d/mZUaipcmk/app-generique?orgId=1&refresh=5s&var-id=$appIdSlug"
        },
        "cloudshell": {
            "catalogId": "internal",
            "packageName": "shelly"
        },
        "initScript":
            "https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/onyxia-init.sh"
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
};
