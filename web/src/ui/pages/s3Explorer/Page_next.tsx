import { routes, getRoute } from "ui/routes";
import { routeGroup } from "./route";
import { assert } from "tsafe/assert";
import { withLoader } from "ui/tools/withLoader";
import { enforceLogin } from "ui/shared/enforceLogin";
import { getCore, useCoreState, getCoreSync } from "core";
import { Explorer } from "./Explorer";
import { useEvt } from "evt/hooks";
import { S3ExplorerDialogs, type S3ExplorerDialogsProps } from "./dialogs";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { stringifyS3Uri } from "core/tools/S3Uri";
import { S3ProfileSelect } from "./S3ProfileSelect";
import { S3BookmarksBar } from "./S3BookmarksBar";
import { S3UriBar } from "./S3UriBar";
import { S3Explorer } from "./S3Explorer";

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
            {mainView.profileSelect !== undefined && <S3ProfileSelect />}
            <S3BookmarksBar
                bookmarks={mainView.bookmarks.map(bookmark => {
                    assert(mainView.profileSelect !== undefined);

                    const profileName = mainView.profileSelect.value;

                    const s3UriPrefix_str = stringifyS3Uri(bookmark.s3UriPrefix);

                    return {
                        displayName: bookmark.displayName ?? s3UriPrefix_str,
                        link: routes.s3Explorer({
                            s3UriPrefixWithoutScheme: s3UriPrefix_str.slice(
                                "s3://".length
                            ),
                            profile: profileName
                        }).link
                    };
                })}
            />
            <S3UriBar
                s3Uri={
                    mainView.navigationUri !== undefined
                        ? stringifyS3Uri(mainView.navigationUri)
                        : "s3://"
                }
                onS3UriChange={({ s3Uri }) => {}}
            />
        </>
    );

    //return (
    //    <div className={classes.root}>
    //        <div
    //            style={{
    //                display: "flex"
    //            }}
    //        >
    //            <S3ProfileSelect dialogsProps={dialogProps} />
    //            <BookmarkBar
    //                className={css({
    //                    flex: 1
    //                })}
    //            />
    //        </div>
    //        {/* Not conditionally mounted to track state */}
    //        <DirectNavigation
    //            className={css({
    //                marginTop: theme.spacing(5),
    //                display:
    //                    rootViewState === "no location - user need to specify location"
    //                        ? undefined
    //                        : "none"
    //            })}
    //        />
    //        {(() => {
    //            switch (rootViewState) {
    //                case "no s3 profile yet - user need to create one":
    //                    return <h1>Create a profile</h1>;
    //                case "no location - user need to specify location":
    //                    return <BookmarkPanel />;
    //                case "explorer can be rendered":
    //                    return <Explorer className={classes.explorer} />;
    //            }
    //        })()}
    //        <S3ExplorerDialogs {...dialogProps} />
    //    </div>
    //);
}
