import { lazy, memo } from "react";
export * from "./route";
export const LazyComponent = memo(lazy(() => import("./Page")));
