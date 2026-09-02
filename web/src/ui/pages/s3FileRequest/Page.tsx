import { getCore, getCoreSync, useCoreState } from "core";
import { assert } from "tsafe";
import { getRoute } from "ui/routes";
import { S3FileRequest } from "ui/shared/codex/S3FileRequest/S3FileRequest";
import { withLoader } from "ui/tools/withLoader";
import { routeGroup } from "./route";

const Page = withLoader({
    loader,
    Component: S3FileRequestPage
});

export default Page;

async function loader() {
    const route = getRoute();
    assert(routeGroup.has(route));

    const core = await getCore();

    core.functions.s3FileRequestUiController.load({
        presignedPost: route.params.presignedPost
    });
}

function S3FileRequestPage() {
    const { expirationTime, uploads } = useCoreState(
        "s3FileRequestUiController",
        "mainView"
    );
    const {
        functions: { s3FileRequestUiController }
    } = getCoreSync();

    return (
        <S3FileRequest
            expirationTime={expirationTime}
            uploads={uploads}
            onUploadFiles={({ files }) => {
                void s3FileRequestUiController.uploadFiles({ files });
            }}
            onCancelUpload={s3FileRequestUiController.cancelUpload}
            onRetryUpload={({ uploadId }) => {
                void s3FileRequestUiController.retryUpload({ uploadId });
            }}
        />
    );
}
