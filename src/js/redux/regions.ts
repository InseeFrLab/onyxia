import type { Region } from "js/model/Region";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import { assert } from "evt/tools/typeSafety/assert";

export type State = {
	regions: Region[] | undefined;
	selectedRegion: Region | undefined;
};

export const name = "regions"; //TODO: French

const slice = createSlice({
	name,
	"initialState": id<State>({
		"regions": undefined,
		"selectedRegion": undefined
	}),
	"reducers": {
		/*
		{
  		type: 'onyxia/regions/newRegions',
  		payload: {
    		regions: [
      		{
        		id: 'datalab',
        		name: 'DG Insee',
        		description: 'Region principale. Plateforme hébergée sur les serveurs de la direction générale de l\'INSEE',
        		location: {
          		lat: 48.8164,
          		name: 'Montrouge (France)',
          		'long': 2.3174
        		},
        		services: {
          		type: 'MARATHON',
          		defaultIpProtection: true,
          		network: 'calico',
          		namespacePrefix: 'users',
          		marathonDnsSuffix: 'marathon.containerip.dcos.thisdcos.directory',
          		expose: {
            		domain: 'lab.sspcloud.fr'
          		},
          		monitoring: {
            		URLPattern: 'https://grafana.lab.sspcloud.fr/d/mZUaipcmk/app-generique?orgId=1&refresh=5s&var-id=$appIdSlug'
          		},
          		cloudshell: {
            		catalogId: 'internal',
            		packageName: 'shelly'
          		},
          		initScript: 'https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/onyxia-init.sh'
        		},
        		data: {
          		S3: {
            		monitoring: {
              		URLPattern: 'https://grafana.lab.sspcloud.fr/d/PhCwEJkMz/minio-user?orgId=1&var-username=$bucketId'
            		},
            		URL: 'https://minio.lab.sspcloud.fr'
          		}
        		}
      		},
      		{
        		id: 'gke',
        		name: 'Google cloud',
        		description: 'Region de test. Aucune garantie de service. A n\'utiliser que pour des tests.',
        		location: {
          		lat: 50.8503,
          		name: 'St. Ghislain (Belgium)',
          		'long': 4.3517
        		},
        		services: {
          		type: 'KUBERNETES',
          		defaultIpProtection: false,
          		namespacePrefix: 'user-',
          		expose: {
            		domain: 'demo.dev.sspcloud.fr'
          		},
          		cloudshell: {
            		catalogId: 'inseefrlab-helm-charts-datascience',
            		packageName: 'cloudshell'
          		}
        		},
        		data: {
          		S3: {
            		URL: 'https://minio.demo.dev.sspcloud.fr'
          		}
        		}
      		}
    		]
  		}
		}
		*/
		"newRegions": (
			state,
			{ payload }: PayloadAction<{ regions: Region[]; }>
		) => {
			const { regions } = payload;

			assert( regions instanceof Array );

			state.selectedRegion = regions[0] ?? state.selectedRegion;

			state.regions = regions;

		},
		"regionChanged": (
			state,
			{ payload }: PayloadAction<{ newRegion: Region; }>
		) => {

			const { newRegion } = payload;

			assert(typeof newRegion === "object");

			state.selectedRegion = newRegion;

		}
	}
});

const { actions: syncActions } = slice;

export const actions = {
	...syncActions
};

export const reducer = slice.reducer;
