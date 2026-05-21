import { useEffect, useState } from "react";
import { routes, getRoute, session } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe/assert";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { getCore, useCoreState, getCoreSync } from "core";
import { useEvt } from "evt/hooks";
import { S3ExplorerDialogs, type S3ExplorerDialogsProps } from "./dialogs";
import { useConst } from "powerhooks/useConst";
import { useDomRect } from "powerhooks/useDomRect";
import { Evt } from "evt";
import { S3UriBar } from "ui/shared/codex/S3UriBar";
import { DataGrid } from "ui/pages/dataExplorer/DataGrid";
import CircularProgress from "@mui/material/CircularProgress";
import { useStyles } from "tss";
import {
    S3BookmarksBar,
    type S3BookmarksBarProps
} from "ui/shared/codex/S3Bookmarks/S3BookmarksBar";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { Deferred } from "evt/tools/Deferred";
import { S3ProfileSelect } from "ui/shared/codex/S3ProfileSelect";
import { S3ExplorerMainView } from "ui/shared/codex/S3ExplorerMainView";
import { CommandBar } from "ui/shared/CommandBar";
import { S3BookmarksEntryPointList } from "ui/shared/codex/S3Bookmarks/S3BookmarksEntryPointItem";
import { PageHeader } from "onyxia-ui/PageHeader";
import { customIcons } from "lazy-icons";
import { S3ContextActionButton } from "ui/shared/codex/S3ContextActionButton";
import { getIconUrlByName } from "lazy-icons";
import { useResolveLocalizedString } from "ui/i18n";
import { copyToClipboard } from "ui/tools/copyToClipboard";

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
            evtConfirmOverwriteDialogOpen: new Evt(),
            evtConfirmCustomS3ConfigDeletionDialogOpen: new Evt(),
            evtCreateOrRenameBookmarkDialogOpen: new Evt(),
            evtDirectoryCreationDialogOpen: new Evt(),
            evtMakePrefixPublicDialogOpen: new Evt(),
            evtDisplayErrorDialogOpen: new Evt(),
            evtS3ProfileDialogOpen: new Evt(),
            evtS3ShareObjectDialogOpen: new Evt(),
            evtMaybeAcknowledgeConfigVolatilityDialogOpen: new Evt()
        })
    );

    const evtS3ExplorerMainViewAction = useConst(() =>
        Evt.create<"CHOSE FILES TO UPLOAD">()
    );

    const {
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();

    useEvt(ctx => {
        evtS3ExplorerUiController
            .pipe(ctx)
            .attach(
                data => data.action === "ask confirmation for bucket creation attempt",
                ({ bucket, createBucket }) =>
                    dialogProps.evtConfirmBucketCreationAttemptDialogOpen.post({
                        bucket,
                        createBucket
                    })
            )
            .attach(
                data => data.action === "ask overwrite confirmation",
                ({ s3Uri, resolveResponse }) =>
                    dialogProps.evtConfirmOverwriteDialogOpen.post({
                        s3Uri,
                        resolveResponse
                    })
            )
            .attach(
                data => data.action === "display error",
                ({ errorMessage }) =>
                    dialogProps.evtDisplayErrorDialogOpen.post({
                        errorMessage
                    })
            );
    }, []);

    const mainView = useCoreState("s3ExplorerUiController", "mainView");
    const { resolveLocalizedString } = useResolveLocalizedString();
    const [copiedS3Uri, setCopiedS3Uri] = useState<S3Uri | undefined>(undefined);

    const { css, theme } = useStyles();

    const { isCommandBarEnabled } = useCoreState("userConfigs", "userConfigs");

    const {
        ref: ref_root,
        domRect: { height: rootHeight }
    } = useDomRect();

    const openBookmarkDialog = async (params: { s3Uri: S3Uri }) => {
        const { s3Uri } = params;
        const existingBookmark = mainView.bookmarks.items.find(
            item => stringifyS3Uri(item.s3Uri) === stringifyS3Uri(s3Uri)
        );

        if (existingBookmark?.isReadonly) {
            return;
        }

        const dResult = new Deferred<
            { doProceed: true; displayName: string } | { doProceed: false }
        >();

        dialogProps.evtCreateOrRenameBookmarkDialogOpen.post({
            s3Uri,
            currentDisplayName:
                existingBookmark?.displayName === undefined
                    ? undefined
                    : resolveLocalizedString(existingBookmark.displayName),
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
    };

    const copyS3Uri = async (params: { s3Uri: S3Uri }) => {
        const { s3Uri } = params;

        await copyToClipboard(stringifyS3Uri(s3Uri));
        setCopiedS3Uri(s3Uri);
    };

    const toggleBookmarkFromDataView = (params: { s3Uri: S3Uri }) => {
        const { s3Uri } = params;
        const existingBookmark = mainView.bookmarks.items.find(
            item => stringifyS3Uri(item.s3Uri) === stringifyS3Uri(s3Uri)
        );

        if (existingBookmark !== undefined) {
            if (!existingBookmark.isReadonly) {
                s3ExplorerUiController.deleteBookmark({ s3Uri });
            }

            return;
        }

        openBookmarkDialog({ s3Uri });
    };

    useEffect(() => {
        if (copiedS3Uri === undefined) {
            return;
        }

        const timeoutId = window.setTimeout(() => setCopiedS3Uri(undefined), 1800);

        return () => window.clearTimeout(timeoutId);
    }, [copiedS3Uri]);

    const props_bookmarkBar = {
        items: mainView.bookmarks.items,
        activeItemS3Uri: mainView.bookmarks.activeItemS3Uri,
        getItemLink: ({ s3Uri }) => {
            const route = getRoute();
            assert(routeGroup.has(route));

            assert(mainView.profileSelect !== undefined);

            return routes.s3Explorer({
                ...route.params,
                s3UriWithoutScheme: stringifyS3Uri(s3Uri).slice("s3://".length),
                profile: mainView.profileSelect.selectedProfile.name
            }).link;
        },
        onDelete: s3ExplorerUiController.deleteBookmark,
        onRename: ({ s3Uri }) => openBookmarkDialog({ s3Uri })
    } satisfies S3BookmarksBarProps;

    return (
        <>
            <S3ExplorerDialogs {...dialogProps} />
            <div
                ref={ref_root}
                className={css({
                    height: "100%",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column"
                })}
            >
                <div
                    className={css({
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "flex-start",
                        gap: theme.spacing(3),
                        marginBottom: theme.spacing(2)
                    })}
                >
                    <div
                        className={css({
                            flex: "0 0 auto",
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
                                flex: 1,
                                minWidth: 0,
                                height:
                                    theme.typography.rootFontSizePx * 1.7 +
                                    2 * theme.spacing(2),
                                position: "relative"
                            })}
                        >
                            <CommandBar
                                classes={{
                                    root: css({
                                        position: "absolute",
                                        right: 0,
                                        width: "min(100%, 700px)",
                                        top: 0,
                                        zIndex: 1,
                                        transition: "opacity 750ms linear"
                                    }),
                                    rootWhenExpended: css({
                                        width: "min(100%, 1450px)",
                                        transition: "width 70ms linear"
                                    })
                                }}
                                entries={mainView.commandLogsEntries}
                                maxHeight={rootHeight - 30}
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
                                    dialogProps.evtS3ProfileDialogOpen.post("create")
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
                                flexDirection: "column",
                                paddingRight: theme.spacing(3)
                            })}
                        >
                            <div
                                className={css({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: theme.spacing(2),
                                    width: "100%",
                                    minWidth: 0
                                })}
                            >
                                <S3ContextActionButton
                                    icon={getIconUrlByName("ArrowBack")}
                                    label="Back"
                                    disabled={mainView.isBackButtonDisabled}
                                    onClick={s3ExplorerUiController.navigateBack}
                                />
                                <S3ProfileSelect
                                    availableProfileNames={
                                        mainView.profileSelect.availableProfileNames
                                    }
                                    selectedProfile={
                                        mainView.profileSelect.selectedProfile
                                    }
                                    onSelectedProfileChange={
                                        s3ExplorerUiController.updateSelectedS3Profile
                                    }
                                    onEditProfile={() =>
                                        dialogProps.evtS3ProfileDialogOpen.post("detail")
                                    }
                                    onCreateNewProfile={() => {
                                        dialogProps.evtS3ProfileDialogOpen.post("create");
                                    }}
                                />
                                <S3UriBar
                                    className={css({
                                        flex: 1,
                                        minWidth: 0
                                    })}
                                    s3Uri={mainView.uriBar.s3Uri}
                                    hints={mainView.uriBar.hints}
                                    areHintsLoading={mainView.isListing}
                                    copiedS3Uri={copiedS3Uri}
                                    onCopyS3Uri={copyS3Uri}
                                    onS3UriChange={({ s3Uri, isHintSelection }) =>
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

                                            s3ExplorerUiController.toggleIsS3UriBookmarked(
                                                {
                                                    getDisplayName
                                                }
                                            );
                                        };
                                    })()}
                                    isBookmarked={
                                        mainView.uriBar.bookmarkStatus.isBookmarked
                                    }
                                />
                                <S3ContextActionButton
                                    icon={getIconUrlByName("UploadFileOutlined")}
                                    label="Upload"
                                    disabled={mainView.isUploadButtonDisabled}
                                    onClick={() =>
                                        evtS3ExplorerMainViewAction.post(
                                            "CHOSE FILES TO UPLOAD"
                                        )
                                    }
                                />
                                <S3ContextActionButton
                                    icon={getIconUrlByName("CreateNewFolderOutlined")}
                                    label="Create new Prefix"
                                    disabled={mainView.directoryCreationButton.isDisabled}
                                    onClick={async () => {
                                        assert(
                                            !mainView.directoryCreationButton.isDisabled
                                        );

                                        const dPrefixSegment = new Deferred<string>();

                                        dialogProps.evtDirectoryCreationDialogOpen.post({
                                            exclude:
                                                mainView.directoryCreationButton.exclude,
                                            resolveDoProceed: params => {
                                                if (!params.doProceed) {
                                                    return;
                                                }

                                                dPrefixSegment.resolve(
                                                    params.prefixSegment
                                                );
                                            }
                                        });

                                        s3ExplorerUiController.createDirectory({
                                            prefixSegment: await dPrefixSegment.pr
                                        });
                                    }}
                                />
                            </div>

                            {mainView.uriBar.s3Uri !== undefined && (
                                <S3BookmarksBar
                                    {...props_bookmarkBar}
                                    className={css({
                                        marginTop: theme.spacing(2),
                                        marginBottom: theme.spacing(2),
                                        minWidth: 0
                                    })}
                                />
                            )}

                            {mainView.uriBar.s3Uri === undefined && (
                                <S3BookmarksEntryPointList
                                    {...props_bookmarkBar}
                                    className={css({
                                        marginTop: theme.spacing(5),
                                        marginBottom: theme.spacing(2),
                                        minWidth: 0,
                                        flex: 1,
                                        overflow: "auto"
                                    })}
                                />
                            )}

                            {mainView.listedPrefix !== undefined && (
                                <S3ExplorerMainView
                                    className={css({
                                        flex: mainView.fullyQualifiedUri
                                            .isFullyQualifiedUri
                                            ? undefined
                                            : 1
                                    })}
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
                                    onDownload={s3ExplorerUiController.downloadObject}
                                    onChangePrefixPolicy={async ({ action, s3Uri }) => {
                                        const dDoProceed = new Deferred<boolean>();

                                        dialogProps.evtMakePrefixPublicDialogOpen.post({
                                            s3Uri,
                                            action,
                                            resolveDoProceed: doProceed => {
                                                dDoProceed.resolve(doProceed);
                                            }
                                        });

                                        if (!(await dDoProceed.pr)) {
                                            return;
                                        }

                                        s3ExplorerUiController.toggleS3UriPublicPrivatePolicy(
                                            { s3Uri }
                                        );
                                    }}
                                    onShareObject={({ s3Uri }) => {
                                        dialogProps.evtS3ShareObjectDialogOpen.post({
                                            s3Uri
                                        });
                                    }}
                                    onBookmark={toggleBookmarkFromDataView}
                                    onCopyS3Uri={copyS3Uri}
                                    bookmarkedS3Uris={mainView.bookmarks.items.map(
                                        item => item.s3Uri
                                    )}
                                    evtAction={evtS3ExplorerMainViewAction}
                                    isUploadDisabled={mainView.isUploadButtonDisabled}
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
