
import { configureStore } from "@reduxjs/toolkit";
import type { ThunkAction, Action } from "@reduxjs/toolkit";
import * as myFiles from "./reducers/myFiles";

export const store = configureStore({
  "reducer": {
    [myFiles.name]: myFiles.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

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




