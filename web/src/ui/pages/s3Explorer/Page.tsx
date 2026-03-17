import { routes, getRoute } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe/assert";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { getCore, useCoreState, getCoreSync } from "core";
import { useEvt } from "evt/hooks";
import { S3ExplorerDialogs, type S3ExplorerDialogsProps } from "./dialogs";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { S3UriBar } from "ui/shared/codex/S3UriBar";
import { DataGrid } from "ui/pages/dataExplorer/DataGrid";
import CircularProgress from "@mui/material/CircularProgress";
import { useStyles } from "tss";

const Page = withLoader({
    loader: async () => {
        await enforceLogin();

        const core = await getCore();

        const route = getRoute();
        assert(routeGroup.has(route));

        const { routeParams_toSet } = core.functions.s3ExplorerUiController.load({
            routeParams: route.params
        });

        routes.s3Explorer(routeParams_toSet).replace();
    },
    Component: PageComponent
});
export default Page;

function PageComponent() {
    const dialogProps = useConst(
        (): S3ExplorerDialogsProps => ({
            evtConfirmBucketCreationAttemptDialogOpen: new Evt(),
            evtConfirmCustomS3ConfigDeletionDialogOpen: new Evt(),
            evtCreateOrUpdateProfileDialogOpen: new Evt(),
            evtMaybeAcknowledgeConfigVolatilityDialogOpen: new Evt()
        })
    );

    const {
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();

    useEvt(ctx => {
        evtS3ExplorerUiController
            .pipe(ctx)
            .attach(
                action => action.action === "updateRoute",
                ({ routeParams, method }) => routes.s3Explorer(routeParams)[method]()
            )
            .attach(
                data => data.action === "ask confirmation for bucket creation attempt",
                ({ bucket, createBucket }) =>
                    dialogProps.evtConfirmBucketCreationAttemptDialogOpen.post({
                        bucket,
                        createBucket
                    })
            );
    }, []);

    const mainView = useCoreState("s3ExplorerUiController", "mainView");

    return (
        <>
            <S3ExplorerDialogs {...dialogProps} />
            {(() => {
                if (mainView.profileSelect === undefined) {
                    return (
                        <button
                            onClick={() =>
                                dialogProps.evtCreateOrUpdateProfileDialogOpen.post({
                                    profileName_toUpdate: undefined
                                })
                            }
                        >
                            Create Profile
                        </button>
                    );
                }

                return (
                    <>
                        <S3UriBar
                            s3Uri={mainView.uriBar.s3Uri}
                            hints={mainView.uriBar.hints}
                            areHintsLoading={mainView.isListing}
                            onS3UriPrefixChange={({ s3Uri, isHintSelection }) =>
                                s3ExplorerUiController.listPrefix({
                                    s3Uri,
                                    debounce:
                                        !isHintSelection && !s3Uri?.isDelimiterTerminated
                                })
                            }
                            onToggleBookmark={
                                mainView.uriBar.bookmarkStatus.isBookmarked &&
                                mainView.uriBar.bookmarkStatus.isReadonly
                                    ? undefined
                                    : s3ExplorerUiController.toggleIsDirectoryPathBookmarked
                            }
                            isBookmarked={mainView.uriBar.bookmarkStatus.isBookmarked}
                        />
                        {mainView.fullyQualifiedUri.isFullyQualifiedUri &&
                            mainView.fullyQualifiedUri.isDataObject && <DataExplorer />}
                    </>
                );
            })()}
        </>
    );
}

function DataExplorer() {
    const { dataGridView } = useCoreState("dataExplorer", "view");

    const { css, theme } = useStyles();

    if (dataGridView === undefined) {
        return <CircularProgress />;
    }

    return (
        <div
            className={css({
                marginTop: theme.spacing(3),
                width: "100%",
                height: "100%",
                overflowY: "hidden",
                overflowX: "auto"
            })}
        >
            <DataGrid />
        </div>
    );
}
