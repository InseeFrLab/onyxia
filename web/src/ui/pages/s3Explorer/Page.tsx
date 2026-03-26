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
import {
    S3BookmarksBar,
    type S3BookmarksBarProps
} from "ui/shared/codex/S3Bookmarks/S3BookmarksBar";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { Deferred } from "evt/tools/Deferred";
import { S3ProfileSelect } from "ui/shared/codex/S3ProfileSelect";
import { S3ExplorerMainView } from "ui/shared/codex/S3ExplorerMainView";
import { CommandBar } from "ui/shared/CommandBar";
import { S3BookmarksEntryPointList } from "ui/shared/codex/S3Bookmarks/S3BookmarksEntryPointItem";
import { PageHeader } from "onyxia-ui/PageHeader";
import { customIcons } from "lazy-icons";

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

    const { isCommandBarEnabled } = useCoreState("userConfigs", "userConfigs");

    const props: S3BookmarksBarProps = {
        //className: css({ marginTop: theme.spacing(4) }),
        items: mainView.bookmarks.items,
        activeItemS3Uri: mainView.bookmarks.activeItemS3Uri,
        getItemLink: ({ s3Uri }) => {
            const route = getRoute();
            assert(routeGroup.has(route));

            return routes.s3Explorer({
                ...route.params,
                s3UriWithoutScheme: stringifyS3Uri(s3Uri).slice("s3://".length)
            }).link;
        },
        onDelete: s3ExplorerUiController.deleteBookmark,
        onRename: async ({ s3Uri, currentDisplayName }) => {
            const dResult = new Deferred<
                { doProceed: true; displayName: string } | { doProceed: false }
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
        }
    };

    return (
        <>
            <S3ExplorerDialogs {...dialogProps} />
            <div
                className={css({
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                })}
            >
                <div
                    className={css({
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        gap: theme.spacing(3),
                        marginBottom: theme.spacing(2)
                    })}
                >
                    <div
                        className={css({
                            flex: 1,
                            minWidth: 0
                        })}
                    >
                        <PageHeader
                            classes={{
                                root: css({ marginBottom: 0 }),
                                title: css({ paddingBottom: 3 })
                            }}
                            mainIcon={customIcons.filesSvgUrl}
                            title="S3 Explorer"
                            helpTitle={undefined}
                            helpContent={<></>}
                            titleCollapseParams={{
                                behavior: "controlled",
                                isCollapsed: false
                            }}
                            helpCollapseParams={{
                                behavior: "controlled",
                                isCollapsed: true
                            }}
                        />
                    </div>

                    {isCommandBarEnabled && mainView.commandLogsEntries.length !== 0 && (
                        <div
                            className={css({
                                position: "relative",
                                width: "min(100%, 640px)",
                                maxWidth: "100%",
                                height: 40,
                                marginLeft: "auto"
                            })}
                        >
                            <CommandBar
                                classes={{
                                    root: css({
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        width: "100%",
                                        zIndex: 4,
                                        transition: "opacity 750ms linear"
                                    }),
                                    rootWhenExpended: css({
                                        width: "100%"
                                    })
                                }}
                                entries={mainView.commandLogsEntries}
                                maxHeight={300}
                                doCollapseOnClickAway={false}
                            />
                        </div>
                    )}
                </div>

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
                        <div
                            className={css({
                                flex: 1,
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "column"
                            })}
                        >
                            <div
                                className={css({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: theme.spacing(3),
                                    width: "100%",
                                    minWidth: 0
                                })}
                            >
                                <S3ProfileSelect
                                    className={css({
                                        width: "fit-content"
                                    })}
                                    availableProfileNames={
                                        mainView.profileSelect.availableProfileNames
                                    }
                                    selectedProfile={
                                        mainView.profileSelect.selectedProfile
                                    }
                                    onSelectedProfileChange={
                                        s3ExplorerUiController.updateSelectedS3Profile
                                    }
                                    onEditProfile={() => {
                                        assert(mainView.profileSelect !== undefined);
                                        dialogProps.evtCreateOrUpdateProfileDialogOpen.post(
                                            {
                                                profileName_toUpdate:
                                                    mainView.profileSelect.selectedProfile
                                                        .name
                                            }
                                        );
                                    }}
                                    onCreateNewProfile={() => {
                                        dialogProps.evtCreateOrUpdateProfileDialogOpen.post(
                                            {
                                                profileName_toUpdate: undefined
                                            }
                                        );
                                    }}
                                />
                                {mainView.uriBar.s3Uri !== undefined && (
                                    <S3BookmarksBar
                                        {...props}
                                        className={css({
                                            flex: 1,
                                            minWidth: 0
                                        })}
                                    />
                                )}
                            </div>
                            <S3UriBar
                                className={css({
                                    marginTop: theme.spacing(2),
                                    marginBottom: theme.spacing(2)
                                })}
                                s3Uri={mainView.uriBar.s3Uri}
                                hints={mainView.uriBar.hints}
                                areHintsLoading={mainView.isListing}
                                onS3UriPrefixChange={({ s3Uri, isHintSelection }) =>
                                    s3ExplorerUiController.listPrefix({
                                        s3Uri,
                                        debounce:
                                            !isHintSelection &&
                                            !s3Uri?.isDelimiterTerminated
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
                                                | {
                                                      doProceed: true;
                                                      displayName: string;
                                                  }
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

                            {mainView.uriBar.s3Uri === undefined && (
                                <S3BookmarksEntryPointList {...props} />
                            )}

                            {mainView.listedPrefix !== undefined && (
                                <S3ExplorerMainView
                                    currentS3Uri={mainView.uriBar.s3Uri}
                                    isListing={mainView.isListing}
                                    listedPrefix={mainView.listedPrefix}
                                    onNavigate={({ s3Uri }) =>
                                        s3ExplorerUiController.listPrefix({
                                            s3Uri,
                                            debounce: false
                                        })
                                    }
                                    onPutObjects={s3ExplorerUiController.putObjects}
                                    onCreateDirectory={
                                        s3ExplorerUiController.createDirectory
                                    }
                                    onDelete={s3ExplorerUiController.delete}
                                    getDirectDownloadUrl={
                                        s3ExplorerUiController.getPreSignedUrl
                                    }
                                />
                            )}
                            {mainView.fullyQualifiedUri.isFullyQualifiedUri &&
                                mainView.fullyQualifiedUri.isDataObject && (
                                    <DataExplorer
                                        className={css({ flex: 1, overflow: "hidden" })}
                                    />
                                )}
                        </div>
                    );
                })()}
            </div>
        </>
    );
}

function DataExplorer(props: { className?: string }) {
    const { className } = props;

    const { dataGridView } = useCoreState("dataExplorer", "view");

    const { cx, css, theme } = useStyles();

    if (dataGridView === undefined) {
        return (
            <div
                className={cx(
                    css({
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }),
                    className
                )}
            >
                <CircularProgress />
            </div>
        );
    }

    return (
        <div
            className={cx(
                css({
                    marginTop: theme.spacing(3),
                    overflowY: "hidden",
                    overflowX: "auto"
                }),
                className
            )}
        >
            <DataGrid />
        </div>
    );
}
