import { useState } from "react";
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
import { S3ExplorerDialogs, type S3ExplorerDialogsProps } from "./S3ExplorerDialogs";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { Button } from "onyxia-ui/Button";

const Page = withLoader({
    loader: async () => {
        await enforceLogin();

        const core = await getCore();

        const route = getRoute();
        assert(routeGroup.has(route));

        const { routeParams_toSet } = await core.functions.s3ExplorerUiController.load({
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
        functions: { s3ExplorerUiController },
        evts: { evtS3ExplorerUiController }
    } = getCoreSync();

    const { classes, css, theme } = useStyles();

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

    const dialogProps = useConst(
        (): S3ExplorerDialogsProps => ({
            evtConfirmBucketCreationAttemptDialogOpen: new Evt(),
            evtConfirmCustomS3ConfigDeletionDialogOpen: new Evt(),
            evtCreateOrUpdateProfileDialogOpen: new Evt(),
            evtMaybeAcknowledgeConfigVolatilityDialogOpen: new Evt()
        })
    );

    const { rootViewState } = useCoreState("s3ExplorerUiController", "rootView");

    return (
        <div className={classes.root}>
            <div
                style={{
                    display: "flex"
                }}
            >
                <S3ProfileSelect dialogsProps={dialogProps} />
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
                        rootViewState === "no location - user need to specify location"
                            ? undefined
                            : "none"
                })}
            />
            {(() => {
                switch (rootViewState) {
                    case "no s3 profile yet - user need to create one":
                        return <h1>Create a profile</h1>;
                    case "no location - user need to specify location":
                        return <BookmarkPanel />;
                    case "explorer can be rendered":
                        return <Explorer className={classes.explorer} />;
                }
            })()}
            <S3ExplorerDialogs {...dialogProps} />
        </div>
    );
}

function BookmarkPanel(props: { className?: string }) {
    const { className } = props;

    const { resolveLocalizedString } = useResolveLocalizedString();

    const { bookmarks } = useCoreState("s3ExplorerUiController", "bookmarkView");

    const {
        functions: { s3ExplorerUiController }
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
                            s3ExplorerUiController.setS3UriPrefixObjAndNavigate({
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
        functions: { s3ExplorerUiController }
    } = getCoreSync();

    const s3UriPrefixObj = useCoreState("s3ExplorerUiController", "s3UriPrefixObj");
    const search_initialValue =
        s3UriPrefixObj === undefined ? "s3://" : stringifyS3UriPrefixObj(s3UriPrefixObj);

    const [search, setSearch] = useState(search_initialValue);

    useEffect(() => {
        setSearch(search_initialValue);
    }, [search_initialValue]);

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
                            const s3UriPrefixObj = (() => {
                                try {
                                    return parseS3UriPrefix({
                                        s3UriPrefix: search,
                                        strict: false
                                    });
                                } catch {
                                    return undefined;
                                }
                            })();

                            if (s3UriPrefixObj === undefined) {
                                return;
                            }

                            s3ExplorerUiController.setS3UriPrefixObjAndNavigate({
                                s3UriPrefixObj
                            });
                        }
                        break;
                    case "Escape":
                        setSearch(search_initialValue);
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
        functions: { s3ExplorerUiController }
    } = getCoreSync();

    const { bookmarks } = useCoreState("s3ExplorerUiController", "bookmarkView");

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
                        s3ExplorerUiController.setS3UriPrefixObjAndNavigate({
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

function S3ProfileSelect(props: { dialogsProps: S3ExplorerDialogsProps }) {
    const { dialogsProps } = props;

    const {
        functions: { s3ExplorerUiController }
    } = getCoreSync();

    const {
        selectedS3ProfileName,
        availableS3ProfileNames,
        isSelectedS3ProfileEditable,
        isS3ProfileSelectionLocked
    } = useCoreState("s3ExplorerUiController", "profileSelectionView");

    const { css } = useStyles();

    return (
        <>
            <FormControl variant="standard">
                <InputLabel id="select-s3Profile">S3 Profile</InputLabel>
                <Select
                    disabled={isS3ProfileSelectionLocked}
                    labelId="select-s3Profile"
                    value={selectedS3ProfileName}
                    onChange={async event => {
                        const { value } = event.target;

                        if (value === "__create__") {
                            const dDoProceed = new Deferred<boolean>();

                            dialogsProps.evtMaybeAcknowledgeConfigVolatilityDialogOpen.post(
                                {
                                    resolve: ({ doProceed }) =>
                                        dDoProceed.resolve(doProceed)
                                }
                            );

                            if (!(await dDoProceed.pr)) {
                                return;
                            }

                            dialogsProps.evtCreateOrUpdateProfileDialogOpen.post({
                                profileName_toUpdate: undefined
                            });

                            return;
                        }
                        s3ExplorerUiController.updateSelectedS3Profile({
                            profileName: value
                        });
                    }}
                    className={css({
                        fontSize: "small"
                    })}
                >
                    {availableS3ProfileNames.map(profileName => (
                        <MenuItem key={profileName} value={profileName}>
                            {profileName}
                        </MenuItem>
                    ))}
                    <MenuItem value="__create__">
                        <Icon icon={getIconUrlByName("Add")} />
                        Create New S3 Profile
                    </MenuItem>
                </Select>
            </FormControl>
            {isSelectedS3ProfileEditable &&
                (() => {
                    assert(selectedS3ProfileName !== undefined);

                    return (
                        <Button
                            startIcon={getIconUrlByName("Edit")}
                            onClick={() => {
                                dialogsProps.evtCreateOrUpdateProfileDialogOpen.post({
                                    profileName_toUpdate: selectedS3ProfileName
                                });
                            }}
                        >
                            Edit
                        </Button>
                    );
                })()}
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
