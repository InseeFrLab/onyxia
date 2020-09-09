import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState, AppThunk } from "../store";
import { id } from "evt/tools/typeSafety/id";
import { getDecodedToken } from "js/utils/localStorageToken";
import * as minio from "js/minio-client/minio-tools";
import { PUSHER } from "js/components/notifications";


export type State = {
	currentBucket: { __brand: "0"; };
	currentObjects: { __brand: "1"; }[];
	currentDirectories: { __brand: "2"; }[];
	/** bucket -> policy */
	bucketsPolicies: Record<string, { __brand: "3" }>;
	userBuckets: State.Bucket[];
};

export namespace State {

	export type Bucket = {
		id: string;
		description: string;
		isPublic: boolean;
	};

}

export const name = "myFiles";

const slice = createSlice({
	name,
	"initialState": id<State>({
		"currentBucket": null as any,
		"currentObjects": [],
		"currentDirectories": [],
		"bucketsPolicies": null as any,
		"userBuckets": [] //TODO, Warning: was previously null
	}),
	"reducers": {
		"loadUserBuckets": (
			state,
			{ payload }: PayloadAction<{ idep: State.Bucket["id"]; }>
		) => {

			const { idep } = payload;

			const { gitlab_group } = getDecodedToken();

			state.userBuckets = [
				{
					"id": idep,
					"description": "bucket personnel", //TODO: Franglish
					"isPublic": false
				},
				...(
					gitlab_group ?
						gitlab_group
							.map(group => group.split(":"))
							.map(([id, ...rest]) => ({
								"id": `groupe-${id}`,
								"description": rest.join(""),
								"isPublic": true,
							}))
						:
						[]
				)
			];

		},
		"emptyCurrentBucket": state => {
			state.currentObjects = [];
			state.currentDirectories = [];
		},
		"addObjectToCurrentBucket": (
			state,
			{ payload }: PayloadAction<{ object: State["currentObjects"][number]; }>
		) => {
			state.currentObjects.push(payload.object);
		},
		"addDirectoryToCurrentBucket": (
			state,
			{ payload }: PayloadAction<{ directory: State["currentDirectories"][number]; }>
		) => {
			state.currentDirectories.push(payload.directory);
		},
		"setBucketPolicy": (
			state,
			{ payload }: PayloadAction<{
				bucket: keyof State["bucketsPolicies"];
				policy: State["bucketsPolicies"][string];
			}>
		) => {
			const { bucket, policy } = payload;
			state.bucketsPolicies[bucket] = policy;
		}
	}
});

const { actions: syncActions } = slice;

const asyncActions = {
	"loadBucketContent": (
		payload: {
			bucketName: string;
			prefix: string;
			rec: boolean;
		}
	): AppThunk => async dispatch => {

		const { bucketName, prefix, rec } = payload;

		dispatch(syncActions.emptyCurrentBucket());

		walkGetUserBucketPolicy: {

		const policy = await minio.getBucketPolicy(bucketName)
			.catch(() => undefined);

		if (policy === undefined) {
			break walkGetUserBucketPolicy;
		}

		dispatch(
			syncActions.setBucketPolicy({
				"bucket": bucketName,
				"policy": JSON.parse(policy)
			})
		);

		}


		//TODO: Investigate at runtime
		const stream = await minio.getBucketContent(bucketName, prefix, rec);

		stream.on(
			"data",
			object => dispatch(
				"prefix" in object ?
					syncActions.addDirectoryToCurrentBucket(object) :
					syncActions.addObjectToCurrentBucket(object)
			)
		);

		stream.on('error', (error: { resource: string; }) =>
			PUSHER.push(`Accés refusé : ${error.resource}`) //TODO: Franglish
		);

	},
	"uploadFileToBucket": (
		payload: {
			file: Blob & { name: string; };
			bucketName: string;
			notify: (msg: string, params: { size: number, stream: any; }) => void;
			path: string;
		}
	) => async () => {

		//TODO: Figure out why there is no dispatch.
		//TODO: Franglish

		const { file, bucketName, notify, path } = payload;

		const result = await minio.uploadFile({ bucketName, file, notify, path })
			.catch(() => undefined);

		if (!result) {

			PUSHER.push(`l'upload du fichier ${file.name} a échoué.`);
			return;

		}

		PUSHER.push(`${file.name} a été uploadé.`);

	},
	"removeObjectFromBucket": (
		payload: {
			bucketName: string;
			objectName: string;
		}
	) => async () => {

		//TODO: Figure out why there is no dispatch.
		//TODO: Franglish

		const { bucketName, objectName } = payload;

		const result = await minio.removeObject({ bucketName, objectName })
			.catch(() => undefined);

		if (!result) {

			PUSHER.push(`la suppression du fichier ${objectName} a échoué.`);
			return;

		}

		PUSHER.push(`${objectName} a été supprimé.`);

	}

};




export const actions = {
	...id<Pick<typeof syncActions, "loadUserBuckets">>(syncActions),
	...asyncActions
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;


