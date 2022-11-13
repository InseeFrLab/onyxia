import { connect } from 'react-redux';
import vignettes from './vignettes';
import { actions } from 'js/redux/legacyActions';
import Visite from './visite-guidee.component';
import { restApiPaths } from "js/restApiPaths";
import { getMinioToken } from "js/minio-client/minio-client";
import {
	getOptions,
	getValuesObject,
} from 'js/components/my-lab/catalogue/catalogue-navigation/leaf/deploiement/nouveau-service';
import { prStore } from "core/setup";
import { prAxiosInstance } from "core/adapters/officialOnyxiaApiClient";
import { unwrapResult } from "@reduxjs/toolkit";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "tsafe/assert";
import { getServices } from "js/api/my-lab";

const { creerNouveauService } = actions;

const mapStateToProps = (state) => {
	const { visite } = state.app;
	return {
		visite,
		"etapes": vignettes,
	};
};

let dServiceCreeId;

const mapToDispatchToProps = dispatch => ({
	"creerPremier": async () => {

		dServiceCreeId = new Deferred();

		const store = await prStore;

		const orchestratorType = store.getState().regions.selectedRegion.services.type;

		const catalogId = orchestratorType === "KUBERNETES" ?
			"inseefrlab-helm-charts-datascience" :
			"inseefrlab-datascience";

		const service = {
			...(await (await prAxiosInstance)(`${restApiPaths.catalogue}/${catalogId}/rstudio`)).data,
			catalogId
		};


		dispatch(
			creerNouveauService({
				service,
				"options": getValuesObject(
					getOptions(
						store.getState().user,
						store.getState().userProfileInVault,
						service,
						await getMinioToken(),
						{}
					).fV
				)
			})
		)
			.then(unwrapResult)
			.then(async contracts => {

				switch (orchestratorType) {
					case "KUBERNETES": 

						dispatch(actions.startWaiting());

						const { apps } = await getServices();

						dispatch(actions.stopWaiting());

						const { id }= apps
							.sort((a, b) => b.startedAt - a.startedAt)
							.filter(({ name }) => /rstudio/.test(name))[0];


						dServiceCreeId.resolve(id);

					break;;
					case "MARATHON":
						dServiceCreeId.resolve(contracts[0].id);
						break;
					default: assert(false);
				}
			});

	},
	"getServiceCreeId": () => dServiceCreeId.pr
});


export default connect(mapStateToProps, mapToDispatchToProps)(Visite);
