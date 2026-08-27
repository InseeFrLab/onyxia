import { getRoute } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe";
import { withLoader } from "ui/tools/withLoader";
import { getCore } from "core";

const Page = withLoader({
    loader,
    Component: S3FileRequest
});
export default Page;

async function loader() {
    const route = getRoute();
    assert(routeGroup.has(route));

    const core = await getCore();

    core.functions.s3FileRequest.load({
        presignedPost: route.params.presignedPost
    });
}

function S3FileRequest() {
    return <h1>Hello</h1>;
}
