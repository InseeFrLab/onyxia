import { Suspense } from "react";
import { S3Uploads } from "ui/shared/codex/S3Uploads";
import { useCoreState, getCoreSync } from "core";
import { tss } from "tss";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { routes } from "ui/routes";
import { setPreSelectedS3Uri } from "ui/shared/codex/S3ExplorerMainView";

export function Uploads() {
    return (
        <Suspense>
            <Uploads_1 />
        </Suspense>
    );
}

function Uploads_1() {
    const { isUserLoggedIn } = useCoreState("userAuthentication", "main");

    if (!isUserLoggedIn) {
        return null;
    }

    return <Uploads_2 />;
}

function Uploads_2() {
    const { uploads } = useCoreState("s3ExplorerUiController", "mainView");

    const {
        functions: { s3ExplorerUiController }
    } = getCoreSync();

    const { classes } = useStyles();

    if (uploads.length === 0) {
        return null;
    }

    return (
        <S3Uploads
            className={classes.root}
            uploads={uploads}
            onCancelUpload={s3ExplorerUiController.cancelUpload}
            onClose={s3ExplorerUiController.flushUploads}
            onRetryUpload={s3ExplorerUiController.retryPutObject}
            getDirectoryLink={({ profileName, s3Uri }) => {
                const link = routes.s3Explorer({
                    profile: profileName,
                    s3UriWithoutScheme: stringifyS3Uri({
                        bucket: s3Uri.bucket,
                        delimiter: s3Uri.delimiter,
                        keySegments: s3Uri.keySegments.slice(0, -1),
                        isDelimiterTerminated: true
                    }).slice("s3://".length)
                }).link;

                const onClick_original = link.onClick;

                link.onClick = (...args) => {
                    setPreSelectedS3Uri({ s3Uri });
                    return onClick_original.call(link, ...args);
                };

                return link;
            }}
        />
    );
}

const useStyles = tss.withName({ Uploads }).create(({ theme }) => ({
    root: {
        position: "fixed",
        bottom: theme.spacing(6),
        right: theme.spacing(4),
        width: 500,
        maxHeight: `min(${window.innerHeight - 200}px, 700px)`
    }
}));
