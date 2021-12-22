import { Suspense, lazy } from "react";
import Loader from "js/components/commons/loader";
//import { createGroup } from "type-route";
//import { routes } from "ui/routes/router";

const TrainingsTmp = lazy(() => import("./component"));

//Trainings.routeGroup = createGroup([routes.trainings]);

Trainings.getDoRequireUserLoggedIn = false;

export function Trainings() {
    return (
        <Suspense fallback={<Loader em={18} />}>
            <TrainingsTmp />
        </Suspense>
    );
}
