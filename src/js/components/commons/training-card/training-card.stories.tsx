import TrainingCard from "./component";
import fakeTraining from "js/model/sampledata/basic-training.json";

export default {
    title: "Training card",
    component: TrainingCard,
    includeStories: []
};

const deployment = "deploy";
const hasPart = [fakeTraining];

export const None = () => <TrainingCard training={fakeTraining} />;

None.story = {
    title: "No links"
};

export const Training = () => <TrainingCard training={{ ...fakeTraining, hasPart }} />;

Training.story = {
    title: "Training link"
};

export const Deployment = () => (
    <TrainingCard training={{ ...fakeTraining, deployment }} />
);

Deployment.story = {
    title: "Deployment link"
};

export const Both = () => (
    <TrainingCard training={{ ...fakeTraining, hasPart, deployment }} />
);

Both.story = {
    title: "Both links"
};
