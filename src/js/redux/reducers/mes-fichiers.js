import * as types from 'js/redux/actions/constantes';

const initial = {
	currentBucket: null,
	currentObjects: [],
	currentDirectories: [],
	bucketsPolicies: null,
	waitingPaths: [],
	userBuckets: [],
};

export default (state = initial, { type, payload }) => {
	switch (type) {
		case types.USER_BUCKETS_LOADED: {
			return { ...state, userBuckets: payload.buckets };
		}
		case types.EMPTY_CURRENT_BUCKET: {
			return { ...state, currentObjects: [], currentDirectories: [] };
		}
		case types.ADD_OBJECT_TO_CURRENT_BUCKET: {
			return {
				...state,
				currentObjects: [...state.currentObjects, payload.object],
			};
		}
		case types.ADD_DIRECTORY_TO_CURRENT_BUCKET: {
			return {
				...state,
				currentDirectories: [...state.currentDirectories, payload.directory],
			};
		}
		case types.SET_CURRENT_BUCKET: {
			return { ...state, currentBucket: payload.bucket };
		}
		case types.GET_BUCKET_POLICY: {
			const { bucket, policy } = payload;
			return {
				...state,
				bucketsPolicies: { ...state.bucketsPolicies, [bucket]: policy },
			};
		}
		case types.ADD_WAITING_PATH: {
			return {
				...state,
				waitingPaths: [...state.waitingPaths, payload.path],
			};
		}
		case types.REMOVE_WAITING_PATH: {
			return {
				...state,
				waitingPaths: state.waitingPaths.filter((p) => p !== payload.path),
			};
		}
		default:
			return state;
	}
};
