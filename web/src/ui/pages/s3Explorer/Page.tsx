import { useEffect } from "react";
import { routes, getRoute, session } from "ui/routes";
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
import { S3BookmarksBar } from "ui/shared/codex/S3Bookmarks/S3BookmarksBar";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { Deferred } from "evt/tools/Deferred";

const Page = withLoader({
    loader,
    Component: PageComponent
});
export default Page;

async function loader() {
    await enforceLogin();

    const core = await getCore();

    const route = getRoute();
    assert(routeGroup.has(route));

    const { routeParams_toSet } = core.functions.s3ExplorerUiController.load({
        routeParams: route.params
    });

    routes.s3Explorer(routeParams_toSet).replace();
}

function useRouteSync() {
    const {
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();

    useEffect(
        () =>
            session.listen(route => {
                if (routeGroup.has(route)) {
                    s3ExplorerUiController.notifyRouteParamsExternallyUpdated({
                        routeParams: route.params
                    });
                }
            }),
        []
    );

    useEvt(ctx => {
        evtS3ExplorerUiController.pipe(ctx).attach(
            action => action.action === "updateRoute",
            ({ routeParams, method }) => routes.s3Explorer(routeParams)[method]()
        );
    }, []);
}

function PageComponent() {
    useRouteSync();

    const dialogProps = useConst(
        (): S3ExplorerDialogsProps => ({
            evtConfirmBucketCreationAttemptDialogOpen: new Evt(),
            evtConfirmCustomS3ConfigDeletionDialogOpen: new Evt(),
            evtCreateOrRenameBookmarkDialogOpen: new Evt(),
            evtCreateOrUpdateProfileDialogOpen: new Evt(),
            evtMaybeAcknowledgeConfigVolatilityDialogOpen: new Evt()
        })
    );

    const {
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();

    useEvt(ctx => {
        evtS3ExplorerUiController.pipe(ctx).attach(
            data => data.action === "ask confirmation for bucket creation attempt",
            ({ bucket, createBucket }) =>
                dialogProps.evtConfirmBucketCreationAttemptDialogOpen.post({
                    bucket,
                    createBucket
                })
        );
    }, []);

    const mainView = useCoreState("s3ExplorerUiController", "mainView");

    const { css, theme } = useStyles();

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
                            onToggleBookmark={(() => {
                                if (
                                    mainView.uriBar.bookmarkStatus.isBookmarked &&
                                    mainView.uriBar.bookmarkStatus.isReadonly
                                ) {
                                    return undefined;
                                }

                                return ({ s3Uri }) => {
                                    const getDisplayName = () => {
                                        const dResult = new Deferred<
                                            | { doProceed: true; displayName: string }
                                            | { doProceed: false }
                                        >();

                                        dialogProps.evtCreateOrRenameBookmarkDialogOpen.post(
                                            {
                                                s3Uri,
                                                currentDisplayName: undefined,
                                                resolveDoProceed: dResult.resolve
                                            }
                                        );

                                        return dResult.pr;
                                    };

                                    s3ExplorerUiController.toggleIsS3UriBookmarked({
                                        getDisplayName
                                    });
                                };
                            })()}
                            isBookmarked={mainView.uriBar.bookmarkStatus.isBookmarked}
                        />
                        <S3BookmarksBar
                            className={css({ marginTop: theme.spacing(3) })}
                            items={mainView.bookmarks.items}
                            activeItemS3Uri={mainView.bookmarks.activeItemS3Uri}
                            getItemLink={({ s3Uri }) => {
                                const route = getRoute();
                                assert(routeGroup.has(route));

                                return routes.s3Explorer({
                                    ...route.params,
                                    s3UriWithoutScheme: stringifyS3Uri(s3Uri).slice(
                                        "s3://".length
                                    )
                                }).link;
                            }}
                            onDelete={s3ExplorerUiController.deleteBookmark}
                            onRename={async ({ s3Uri, currentDisplayName }) => {
                                const dResult = new Deferred<
                                    | { doProceed: true; displayName: string }
                                    | { doProceed: false }
                                >();

                                dialogProps.evtCreateOrRenameBookmarkDialogOpen.post({
                                    s3Uri,
                                    currentDisplayName,
                                    resolveDoProceed: dResult.resolve
                                });

                                const result = await dResult.pr;

                                if (!result.doProceed) {
                                    return;
                                }

                                s3ExplorerUiController.updateBookmarkDisplayName({
                                    s3Uri,
                                    displayName: result.displayName
                                });
                            }}
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
                height: `calc(100% - ${theme.spacing(4)}px)`,
                overflowY: "hidden",
                overflowX: "auto"
            })}
        >
            <DataGrid />
        </div>
    );
}
