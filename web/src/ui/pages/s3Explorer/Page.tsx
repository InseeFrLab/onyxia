import { useRoute, getRoute, routes } from "ui/routes";
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
import { Button } from "onyxia-ui/Button";
import { tss } from "tss";

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
    const route = useRoute();
    assert(routeGroup.has(route));

    const {
        functions: { s3ExplorerRootUiController }
    } = getCoreSync();

    const { selectedS3ProfileId, availableS3Profiles, bookmarks, location } =
        useCoreState("s3ExplorerRootUiController", "view");

    const { classes } = useStyles();

    return (
        <div>
            <FormControl fullWidth>
                <InputLabel id="select-s3Profile">S3 Profile</InputLabel>
                <Select
                    labelId="select-s3Profile"
                    value={selectedS3ProfileId}
                    onChange={event => {
                        s3ExplorerRootUiController.updateSelectedS3Profile({
                            s3ProfileId: event.target.value
                        });
                    }}
                >
                    {availableS3Profiles.map(s3Profile => (
                        <MenuItem key={s3Profile.id} value={s3Profile.id}>
                            {s3Profile.displayName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <div className={classes.bookmarksBar}>
                {bookmarks.map((bookmark, i) => (
                    <Button
                        key={i}
                        variant="ternary"
                        onClick={() =>
                            s3ExplorerRootUiController.updateLocation({
                                bucket: bookmark.bucket,
                                keyPrefix: bookmark.keyPrefix
                            })
                        }
                    >{`s3://${bookmark.bucket}/${bookmark.keyPrefix}`}</Button>
                ))}
            </div>

            {(() => {
                if (selectedS3ProfileId === undefined) {
                    return <h1>Create a profile</h1>;
                }

                if (location === undefined) {
                    return <h1>Direct navigation</h1>;
                }

                return (
                    <Explorer
                        changeCurrentDirectory={({ directoryPath }) => {
                            const [bucket, ...rest] = directoryPath.split("/");
                            s3ExplorerRootUiController.updateLocation({
                                bucket,
                                keyPrefix: rest.join("/")
                            });
                        }}
                        directoryPath={`${location.bucket}/${location.keyPrefix}`}
                    />
                );
            })()}
        </div>
    );
}

const useStyles = tss.withName({ S3Explorer }).create(({ theme }) => ({
    bookmarksBar: {
        display: "inline-flex",
        gap: theme.spacing(2)
    }
}));
