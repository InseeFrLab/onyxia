import { useState, useMemo } from "react";
import { useEffect } from "react";
import { routes, getRoute, session } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe/assert";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { getCore, useCoreState, getCoreSync } from "core";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Explorer } from "./Explorer";
import { tss } from "tss";
import { useEvt } from "evt/hooks";
import { Text } from "onyxia-ui/Text";
import MuiLink from "@mui/material/Link";
import { SearchBar } from "onyxia-ui/SearchBar";
import { parseS3UriPrefix, stringifyS3UriPrefixObj } from "core/tools/S3Uri";
import { useResolveLocalizedString } from "ui/i18n";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { S3ConfigDialogs, type S3ConfigDialogsProps } from "./S3ConfigDialogs";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import {
    MaybeAcknowledgeConfigVolatilityDialog,
    type MaybeAcknowledgeConfigVolatilityDialogProps
} from "ui/shared/MaybeAcknowledgeConfigVolatilityDialog";
import { Deferred } from "evt/tools/Deferred";
import { Button } from "onyxia-ui/Button";

const Page = withLoader({
    loader: async () => {
        await enforceLogin();

        const core = await getCore();

        const route = getRoute();
        assert(routeGroup.has(route));

        const { routeParams_toSet } =
            await core.functions.s3ExplorerRootUiController.load({
                routeParams: route.params
            });

        if (routeParams_toSet !== undefined) {
            routes.s3Explorer(routeParams_toSet).replace();
        }
    },
    Component: S3Explorer
});
export default Page;

function S3Explorer() {
    const {
        functions: { s3ExplorerRootUiController },
        evts: { evtS3ExplorerRootUiController }
    } = getCoreSync();

    const { selectedS3ProfileId, s3UriPrefixObj, bookmarkStatus } = useCoreState(
        "s3ExplorerRootUiController",
        "view"
    );

    const { classes, css, theme } = useStyles();

    useEvt(ctx => {
        evtS3ExplorerRootUiController
            .pipe(ctx)
            .pipe(action => action.actionName === "updateRoute")
            .attach(({ routeParams, method }) =>
                routes.s3Explorer(routeParams)[method]()
            );
    }, []);

    useEffect(
        () =>
            session.listen(route => {
                if (routeGroup.has(route)) {
                    s3ExplorerRootUiController.notifyRouteParamsExternallyUpdated({
                        routeParams: route.params
                    });
                }
            }),
        []
    );

    return (
        <div className={classes.root}>
            <div
                style={{
                    display: "flex"
                }}
            >
                <S3ProfileSelect />
                <BookmarkBar
                    className={css({
                        flex: 1
                    })}
                />
            </div>
            {/* Not conditionally mounted to track state */}
            <DirectNavigation
                className={css({
                    marginTop: theme.spacing(5),
                    display:
                        selectedS3ProfileId === undefined || s3UriPrefixObj !== undefined
                            ? "none"
                            : undefined
                })}
            />

            {(() => {
                if (selectedS3ProfileId === undefined) {
                    return <h1>Create a profile</h1>;
                }

                if (s3UriPrefixObj === undefined) {
                    return <BookmarkPanel />;
                }

                return (
                    <Explorer
                        className={classes.explorer}
                        changeCurrentDirectory={({ directoryPath }) => {
                            const s3UriPrefixObj =
                                directoryPath === ""
                                    ? undefined
                                    : parseS3UriPrefix({
                                          s3UriPrefix: `s3://${directoryPath}`,
                                          strict: false
                                      });

                            s3ExplorerRootUiController.updateS3Url({
                                s3UriPrefixObj
                            });
                        }}
                        directoryPath={stringifyS3UriPrefixObj(s3UriPrefixObj).slice(
                            "s3://".length
                        )}
                        bookmarkStatus={bookmarkStatus}
                        onToggleIsDirectoryPathBookmarked={
                            s3ExplorerRootUiController.toggleIsDirectoryPathBookmarked
                        }
                    />
                );
            })()}
        </div>
    );
}

function BookmarkPanel(props: { className?: string }) {
    const { className } = props;

    const { resolveLocalizedString } = useResolveLocalizedString();

    const { bookmarks } = useCoreState("s3ExplorerRootUiController", "view");

    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const { cx, css, theme } = useStyles();

    return (
        <div
            className={cx(
                css({
                    padding: theme.spacing(6)
                }),
                className
            )}
        >
            <Text
                typo="navigation label"
                className={css({
                    marginBottom: theme.spacing(4)
                })}
            >
                <Icon icon={getIconUrlByName("Shortcut")} />
                Bookmarks
            </Text>
            {bookmarks.map((bookmark, i) => (
                <div
                    key={i}
                    className={css({
                        display: "flex",
                        marginBottom: theme.spacing(2)
                    })}
                >
                    <MuiLink
                        key={i}
                        href="#"
                        onClick={e => {
                            e.preventDefault();
                            s3ExplorerRootUiController.updateS3Url({
                                s3UriPrefixObj: bookmark.s3UriPrefixObj
                            });
                        }}
                    >
                        {stringifyS3UriPrefixObj(bookmark.s3UriPrefixObj)}
                    </MuiLink>

                    {bookmark.displayName !== undefined && (
                        <Text typo="body 1">
                            - {resolveLocalizedString(bookmark.displayName)}
                        </Text>
                    )}
                </div>
            ))}
        </div>
    );
}

function DirectNavigation(props: { className?: string }) {
    const { className } = props;

    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const { s3UriPrefixObj } = useCoreState("s3ExplorerRootUiController", "view");

    const search_external =
        s3UriPrefixObj === undefined ? "s3://" : stringifyS3UriPrefixObj(s3UriPrefixObj);

    const [search, setSearch] = useState(search_external);

    useEffect(() => {
        if (search_external !== "s3://") {
            setSearch(search_external);
        }
    }, [search_external]);

    const s3UriPrefixObj_search = useMemo(() => {
        try {
            return parseS3UriPrefix({
                s3UriPrefix: search,
                strict: false
            });
        } catch {
            return undefined;
        }
    }, [search]);

    return (
        <SearchBar
            // For gaining focus when actually appears.
            key={s3UriPrefixObj === undefined ? "1" : "2"}
            className={className}
            search={search}
            onSearchChange={setSearch}
            onKeyPress={keyId => {
                switch (keyId) {
                    case "Enter":
                        {
                            if (s3UriPrefixObj_search === undefined) {
                                return;
                            }

                            s3ExplorerRootUiController.updateS3Url({
                                s3UriPrefixObj: s3UriPrefixObj_search
                            });
                        }
                        break;
                    case "Escape":
                        setSearch(search_external);
                        break;
                }
            }}
        />
    );
}

function BookmarkBar(props: { className?: string }) {
    const { className } = props;

    const { cx, css, theme } = useStyles();

    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const { bookmarks } = useCoreState("s3ExplorerRootUiController", "view");

    return (
        <div
            className={cx(
                css({
                    display: "flex",
                    position: "relative",
                    alignItems: "end",
                    gap: theme.spacing(3),
                    paddingBottom: 6
                }),
                className
            )}
        >
            <Text
                className={css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    color: theme.colors.useCases.typography.textSecondary
                })}
                typo="caption"
            >
                Bookmarks
            </Text>
            {bookmarks.map((bookmark, i) => (
                <MuiLink
                    key={i}
                    className={css({
                        color: theme.colors.useCases.typography.textPrimary,
                        ...theme.typography.variants.caption.style
                    })}
                    href="#"
                    onClick={e => {
                        e.preventDefault();
                        s3ExplorerRootUiController.updateS3Url({
                            s3UriPrefixObj: bookmark.s3UriPrefixObj
                        });
                    }}
                >
                    {stringifyS3UriPrefixObj(bookmark.s3UriPrefixObj)}
                </MuiLink>
            ))}
        </div>
    );
}

function S3ProfileSelect() {
    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const { selectedS3ProfileId, selectedS3Profile_creationTime, availableS3Profiles } =
        useCoreState("s3ExplorerRootUiController", "view");

    const { css } = useStyles();

    const {
        evtConfirmCustomS3ConfigDeletionDialogOpen,
        evtAddCustomS3ConfigDialogOpen,
        evtMaybeAcknowledgeConfigVolatilityDialogOpen
    } = useConst(() => ({
        evtConfirmCustomS3ConfigDeletionDialogOpen:
            Evt.create<
                UnpackEvt<
                    S3ConfigDialogsProps["evtConfirmCustomS3ConfigDeletionDialogOpen"]
                >
            >(),
        evtAddCustomS3ConfigDialogOpen:
            Evt.create<
                UnpackEvt<S3ConfigDialogsProps["evtAddCustomS3ConfigDialogOpen"]>
            >(),
        evtMaybeAcknowledgeConfigVolatilityDialogOpen:
            Evt.create<MaybeAcknowledgeConfigVolatilityDialogProps["evtOpen"]>()
    }));

    return (
        <>
            <FormControl variant="standard">
                <InputLabel id="select-s3Profile">S3 Profile</InputLabel>
                <Select
                    labelId="select-s3Profile"
                    value={selectedS3ProfileId}
                    onChange={async event => {
                        const { value } = event.target;

                        if (value === "__create__") {
                            const dDoProceed = new Deferred<boolean>();

                            evtMaybeAcknowledgeConfigVolatilityDialogOpen.post({
                                resolve: ({ doProceed }) => dDoProceed.resolve(doProceed)
                            });

                            if (!(await dDoProceed.pr)) {
                                return;
                            }

                            evtAddCustomS3ConfigDialogOpen.post({
                                creationTimeOfS3ProfileToEdit: undefined
                            });

                            return;
                        }
                        s3ExplorerRootUiController.updateSelectedS3Profile({
                            s3ProfileId: value
                        });
                    }}
                    className={css({
                        fontSize: "small"
                    })}
                >
                    {availableS3Profiles.map(s3Profile => (
                        <MenuItem key={s3Profile.id} value={s3Profile.id}>
                            {s3Profile.displayName}
                        </MenuItem>
                    ))}
                    <MenuItem value="__create__">
                        <Icon icon={getIconUrlByName("Add")} />
                        Create New S3 Profile
                    </MenuItem>
                </Select>
            </FormControl>
            {selectedS3Profile_creationTime !== undefined && (
                <Button
                    startIcon={getIconUrlByName("Edit")}
                    onClick={() => {
                        evtAddCustomS3ConfigDialogOpen.post({
                            creationTimeOfS3ProfileToEdit: selectedS3Profile_creationTime
                        });
                    }}
                >
                    Edit
                </Button>
            )}
            <S3ConfigDialogs
                evtConfirmCustomS3ConfigDeletionDialogOpen={
                    evtConfirmCustomS3ConfigDeletionDialogOpen
                }
                evtAddCustomS3ConfigDialogOpen={evtAddCustomS3ConfigDialogOpen}
            />
            <MaybeAcknowledgeConfigVolatilityDialog
                evtOpen={evtMaybeAcknowledgeConfigVolatilityDialogOpen}
            />
        </>
    );
}

const useStyles = tss.withName({ S3Explorer }).create(({ theme }) => ({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto"
    },
    explorer: {
        marginTop: theme.spacing(4),
        flex: 1
    }
}));
