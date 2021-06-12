import type { Get_Public_Configuration } from "lib/ports/OnyxiaApiClient";

export const regions: Get_Public_Configuration["regions"] =
    [
        {
            "id": 'datalab',
            "name": 'DG Insee',
            "description": 'Region principale. Plateforme hébergée sur les serveurs de la direction générale de l\'INSEE',
            "location": {
                "lat": 48.8164,
                "name": 'Montrouge (France)',
                "long": 2.3174
            },
            "services": {
                "type": 'MARATHON',
                "defaultIpProtection": true,
                "network": 'calico',
                "namespacePrefix": 'users',
                "marathonDnsSuffix": 'marathon.containerip.dcos.thisdcos.directory',
                "expose": {
                    "domain": 'lab.sspcloud.fr'
                },
                "monitoring": {
                    "URLPattern": 'https://grafana.lab.sspcloud.fr/d/mZUaipcmk/app-generique?orgId=1&refresh=5s&var-id=$appIdSlug'
                },
                "cloudshell": {
                    "catalogId": 'internal',
                    "packageName": 'shelly'
                },
                "initScript": 'https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/onyxia-init.sh'
            },
            "data": {
                "S3": {
                    "monitoring": {
                        "URLPattern": 'https://grafana.lab.sspcloud.fr/d/PhCwEJkMz/minio-user?orgId=1&var-username=$bucketId'
                    },
                    "URL": 'https://minio.lab.sspcloud.fr'
                }
            }
        },
        {
            "id": 'gke',
            "name": 'Google cloud',
            "description": 'Region de test. Aucune garantie de service. A n\'utiliser que pour des tests.',
            "location": {
                "lat": 50.8503,
                "name": 'St. Ghislain (Belgium)',
                "long": 4.3517
            },
            "services": {
                "type": 'KUBERNETES',
                "defaultIpProtection": false,
                "namespacePrefix": 'user-',
                "expose": {
                    "domain": 'demo.dev.sspcloud.fr'
                },
                "cloudshell": {
                    "catalogId": 'inseefrlab-helm-charts-datascience',
                    "packageName": 'cloudshell'
                }
            },
            "data": {
                "S3": {
                    "URL": 'https://minio.demo.dev.sspcloud.fr'
                }
            }
        }
    ];

export const build: Get_Public_Configuration["build"] = {
    "version": "0.7.3",
    "timestamp": Date.now()
};