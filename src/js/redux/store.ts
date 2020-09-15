
import { configureStore } from "@reduxjs/toolkit";
import * as myFiles from "./myFiles";
import * as myLab from "./myLab";
import * as app from "./app";
import * as user from "./user";

export const store = configureStore({
  "reducer": {
	[myFiles.name]: myFiles.reducer,
	[myLab.name]: myLab.reducer,
	[app.name]: app.reducer,
	[user.name]: user.reducer

  }
});

export type RootState = ReturnType<typeof store.getState>;

/*
import { createStore } from 'redux';
import thunk from 'redux-thunk';
import { compose, applyMiddleware } from 'redux';
import reducers from 'js/redux/reducers';

const interceptor = store => next => action => {
	if (typeof action === 'function') {
	}
	return next(action);
};
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const initStore = initialState =>
	createStore(
		reducers,
		initialState,
		composeEnhancers(applyMiddleware(interceptor, thunk))
	);

export default initStore();
*/




