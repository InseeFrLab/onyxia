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
import { S3PrefixUrlParsed } from "core/tools/S3PrefixUrlParsed";

const Page = withLoader({
    loader: async () => {
        await enforceLogin();

        const core = await getCore();

        const route = getRoute();
        assert(routeGroup.has(route));

        const { routeParams_toSet } = core.functions.s3ExplorerRootUiController.load({
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

    const { selectedS3ProfileId, availableS3Profiles, s3Url_parsed } = useCoreState(
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
                    display: "flex",
                    gap: theme.spacing(3)
                }}
            >
                <FormControl variant="standard">
                    <InputLabel id="select-s3Profile">S3 Profile</InputLabel>
                    <Select
                        labelId="select-s3Profile"
                        value={selectedS3ProfileId}
                        onChange={event => {
                            s3ExplorerRootUiController.updateSelectedS3Profile({
                                s3ProfileId: event.target.value
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
                    </Select>
                </FormControl>
                <BookmarkBar
                    className={css({
                        flex: 1
                    })}
                />
            </div>

            {(() => {
                if (selectedS3ProfileId === undefined) {
                    return <h1>Create a profile</h1>;
                }

                if (s3Url_parsed === undefined) {
                    return (
                        <DirectNavigation
                            className={css({
                                marginTop: theme.spacing(3)
                            })}
                        />
                    );
                }

                return (
                    <Explorer
                        className={classes.explorer}
                        changeCurrentDirectory={({ directoryPath }) => {
                            const s3Url_parsed =
                                directoryPath === ""
                                    ? undefined
                                    : S3PrefixUrlParsed.parse(`s3://${directoryPath}`);

                            s3ExplorerRootUiController.updateS3Url({
                                s3Url_parsed
                            });
                        }}
                        directoryPath={S3PrefixUrlParsed.stringify(s3Url_parsed).slice(
                            "s3://".length
                        )}
                        isDirectoryPathBookmarked={false}
                        onToggleIsDirectoryPathBookmarked={() => {
                            alert("TODO: Implement this feature");
                        }}
                    />
                );
            })()}
        </div>
    );
}

function DirectNavigation(props: { className?: string }) {
    const { className } = props;

    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const PROTOCOL = "s3://";

    const [search, setSearch] = useState(PROTOCOL);

    const s3Url_parsed = useMemo(() => {
        try {
            return S3PrefixUrlParsed.parse(search);
        } catch {
            return undefined;
        }
    }, [search]);

    return (
        <SearchBar
            className={className}
            search={search}
            onSearchChange={setSearch}
            onKeyPress={keyId => {
                switch (keyId) {
                    case "Enter":
                        {
                            if (s3Url_parsed === undefined) {
                                return;
                            }

                            s3ExplorerRootUiController.updateS3Url({
                                s3Url_parsed
                            });
                        }
                        break;
                    case "Escape":
                        setSearch(PROTOCOL);
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
                            s3Url_parsed: {
                                bucket: bookmark.bucket,
                                keyPrefix: bookmark.keyPrefix
                            }
                        });
                    }}
                >
                    {`s3://${bookmark.bucket}/${bookmark.keyPrefix}`}
                </MuiLink>
            ))}
        </div>
    );
}

const useStyles = tss.withName({ S3Explorer }).create(({ theme }) => ({
    root: {},
    explorer: {
        marginTop: theme.spacing(4)
    }
}));
