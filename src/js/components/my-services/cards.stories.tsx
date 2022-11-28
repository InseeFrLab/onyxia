import Cards from "js/components/my-services/cards";
import basicService from "js/model/sampledata/service-basic.json";

export default {
    title: "My services",
    component: Cards,
    includeStories: []
};

export const NoServices = () => <Cards services={[]} groups={[]} />;

NoServices.story = {
    title: "No services"
};

export const SingleService = () => <Cards services={[basicService]} groups={[]} />;

SingleService.story = {
    title: "Single service"
};
