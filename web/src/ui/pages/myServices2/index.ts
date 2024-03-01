import { lazy } from "react";
export * from "./route";
export const LazyComponent = lazy(() => import("./MyServices2"));
