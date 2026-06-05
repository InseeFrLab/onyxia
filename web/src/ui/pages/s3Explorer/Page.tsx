import { useEffect } from "react";
import { routes, getRoute, session } from "ui/routes";
import { routeGroup } from "./route";
import { assert, type Equals } from "tsafe";
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
import { declareComponentKeys, useResolveLocalizedString, useTranslation } from "ui/i18n";
import { CodeTextEditor } from "ui/shared/textEditor/CodeTextEditor";
import { Icon } from "onyxia-ui/Icon";
import { getFileBasenameFromUrl } from "core/tools/triggerBrowserDownload";

const Page = withLoader({
    loader,
    Component: S3Explorer
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

function S3Explorer() {
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

    const evtS3UriBarAction = useConst(() =>
        Evt.create<{
            action: "display copy feedback";
            s3Uri: S3Uri;
        }>()
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
    const { t } = useTranslation({ S3Explorer });

    const { css, cx, theme } = useStyles();

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

    const objectPreviewClassName = css({
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        marginTop: theme.spacing(3),
        overflow: "hidden"
    });

    const objectPreviewFrameClassName = cx(
        objectPreviewClassName,
        css({
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            borderRadius: theme.spacing(1)
        })
    );

    const objectPreviewMaxHeight = Math.max(rootHeight - 240, 240);

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
                            title={t("page header title")}
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
                                {t("create profile")}
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
                                    label={t("back")}
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
                                    evtAction={evtS3UriBarAction}
                                />
                                <S3ContextActionButton
                                    icon={getIconUrlByName("UploadFileOutlined")}
                                    label={t("upload")}
                                    disabled={mainView.isUploadButtonDisabled}
                                    onClick={() =>
                                        evtS3ExplorerMainViewAction.post(
                                            "CHOSE FILES TO UPLOAD"
                                        )
                                    }
                                />
                                <S3ContextActionButton
                                    icon={getIconUrlByName("CreateNewFolderOutlined")}
                                    label={t("create new folder")}
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
                                        flex:
                                            mainView.listedPrefix.isErrored ||
                                            !mainView.listedPrefix.isFullyQualifiedUri
                                                ? 1
                                                : undefined
                                    })}
                                    isListing={mainView.isListing}
                                    listedPrefix={mainView.listedPrefix}
                                    onNavigateBack={s3ExplorerUiController.navigateBack}
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
                                    bookmarkedS3Uris={mainView.bookmarks.items.map(
                                        item => item.s3Uri
                                    )}
                                    evtAction={evtS3ExplorerMainViewAction}
                                    isUploadDisabled={mainView.isUploadButtonDisabled}
                                    onDisplayCopyFeedback={({ s3Uri }) =>
                                        evtS3UriBarAction.post({
                                            action: "display copy feedback",
                                            s3Uri
                                        })
                                    }
                                />
                            )}
                            {mainView.objectRendering !== undefined &&
                                (() => {
                                    const { objectRendering } = mainView;
                                    switch (objectRendering.renderAs) {
                                        case "dataset":
                                            return (
                                                <DataExplorer
                                                    className={css({
                                                        flex: 1,
                                                        overflow: "hidden"
                                                    })}
                                                />
                                            );
                                        case "code":
                                            return (
                                                <div className={objectPreviewClassName}>
                                                    <CodeTextEditor
                                                        className={css({
                                                            flex: 1,
                                                            minWidth: 0,
                                                            overflow: "hidden"
                                                        })}
                                                        maxHeight={objectPreviewMaxHeight}
                                                        fallback={
                                                            <div
                                                                className={css({
                                                                    flex: 1,
                                                                    display: "flex",
                                                                    justifyContent:
                                                                        "center",
                                                                    alignItems: "center"
                                                                })}
                                                            >
                                                                <CircularProgress />
                                                            </div>
                                                        }
                                                        language={
                                                            objectRendering.language
                                                        }
                                                        value={objectRendering.code}
                                                        onChange={undefined}
                                                    />
                                                </div>
                                            );
                                        case "image":
                                            return (
                                                <div
                                                    className={
                                                        objectPreviewFrameClassName
                                                    }
                                                >
                                                    <img
                                                        className={css({
                                                            display: "block",
                                                            maxWidth: "100%",
                                                            maxHeight: "100%",
                                                            width: "auto",
                                                            height: "auto",
                                                            objectFit: "contain"
                                                        })}
                                                        src={objectRendering.url}
                                                        alt={getFileBasenameFromUrl(
                                                            objectRendering.url
                                                        )}
                                                    />
                                                </div>
                                            );
                                        case "video":
                                            return (
                                                <div
                                                    className={
                                                        objectPreviewFrameClassName
                                                    }
                                                >
                                                    <video
                                                        className={css({
                                                            display: "block",
                                                            maxWidth: "100%",
                                                            maxHeight: "100%",
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain"
                                                        })}
                                                        controls
                                                        playsInline
                                                        preload="metadata"
                                                        src={objectRendering.url}
                                                    />
                                                </div>
                                            );
                                        case "pdf":
                                            return (
                                                <div className={objectPreviewClassName}>
                                                    <iframe
                                                        className={css({
                                                            flex: 1,
                                                            minWidth: 0,
                                                            border: 0
                                                        })}
                                                        src={objectRendering.url}
                                                        title={getFileBasenameFromUrl(
                                                            objectRendering.url
                                                        )}
                                                    />
                                                </div>
                                            );
                                        case "download button":
                                            return (
                                                <div
                                                    className={
                                                        objectPreviewFrameClassName
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        className={css({
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            gap: theme.spacing(2),
                                                            maxWidth: "min(100%, 420px)",
                                                            padding: theme.spacing(5),
                                                            border: 0,
                                                            borderRadius:
                                                                theme.spacing(1),
                                                            backgroundColor:
                                                                theme.colors.useCases
                                                                    .surfaces.surface2,
                                                            color: theme.colors.useCases
                                                                .typography.textPrimary,
                                                            cursor: "pointer",
                                                            ...theme.typography.variants[
                                                                "body 1"
                                                            ].style,
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    theme.colors.useCases
                                                                        .surfaces
                                                                        .surface3,
                                                                color: theme.colors
                                                                    .useCases.typography
                                                                    .textFocus
                                                            },
                                                            "&:focus-visible": {
                                                                outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                                                                outlineOffset: 2
                                                            }
                                                        })}
                                                        onClick={() =>
                                                            s3ExplorerUiController.downloadObject(
                                                                {
                                                                    s3Uri: objectRendering.s3Uri
                                                                }
                                                            )
                                                        }
                                                        aria-label={t("download file")}
                                                    >
                                                        <Icon
                                                            icon={getIconUrlByName(
                                                                "FileDownload"
                                                            )}
                                                            size="large"
                                                        />
                                                        <span>{t("download file")}</span>
                                                    </button>
                                                </div>
                                            );
                                        default:
                                            assert<Equals<typeof objectRendering, never>>;
                                    }
                                })()}
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

const { i18n } = declareComponentKeys<
    | "page header title"
    | "create profile"
    | "back"
    | "upload"
    | "create new folder"
    | "download file"
>()({ S3Explorer });
export type I18n = typeof i18n;
