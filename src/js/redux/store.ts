
import { configureStore } from "@reduxjs/toolkit";
import * as myFiles from "./myFiles";
import * as myLab from "./myLab";
import * as app from "./app";
import * as user from "./user";
import * as regions from "./regions";

export const store = configureStore({
  "reducer": {
	[myFiles.name]: myFiles.reducer,
	[myLab.name]: myLab.reducer,
	[app.name]: app.reducer,
	[user.name]: user.reducer,
	[regions.name]: regions.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;

