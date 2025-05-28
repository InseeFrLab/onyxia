import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useCoreState } from "core";
import {
    //useTranslation,
    useResolveLocalizedString
} from "ui/i18n";
import { routes } from "ui/routes";
//import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
//import { env } from "env";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { MyFilesDisabledDialog } from "./MyFilesDisabledDialog";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";

export type Props = {
    route: PageRoute;
    className?: string;
};

const MyFilesMaybeDisabled = withLoginEnforced((props: Props) => {
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");
    if (!isFileExplorerEnabled) {
        return <MyFilesDisabledDialog />;
    }
    return <MyFilesIndex {...props} />;
});

export default MyFilesMaybeDisabled;

function MyFilesIndex(props: Props) {
    const { className } = props;

    //const { t } = useTranslation({ MyFilesIndex });

    const { defaultWorkingLocation, bookmarkedLocations } = useCoreState(
        "s3ConfigManagement",
        "indexedS3Locations"
    );

    const { cx, classes } = useStyles();

    const { resolveLocalizedString } = useResolveLocalizedString();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.filesSvgUrl}
                //title={t("page title")}
                title={"S3 Locations index"}
                //helpTitle={t("what this page is used for")}
                helpTitle={<></>}
                helpContent={<></>}
                /*
                helpContent={t("help content", {
                    docHref: env.S3_DOCUMENTATION_LINK,
                    accountTabLink: routes.account({ tabId: "storage" }).link
                })}
                    */
                helpIcon={getIconUrlByName("SentimentSatisfied")}
            />
            <div>
                <Text typo="object heading">{defaultWorkingLocation.dataSource}</Text>
                <Button
                    {...routes.myFiles({ path: defaultWorkingLocation.directoryPath })
                        .link}
                    doOpenNewTabIfHref={false}
                >
                    Go
                </Button>
            </div>
            {bookmarkedLocations.map(({ title, description, directoryPath }, i) => (
                <div key={i}>
                    <Text typo="object heading">{resolveLocalizedString(title)}</Text>
                    {description !== undefined && (
                        <Text typo="caption">{resolveLocalizedString(description)}</Text>
                    )}
                    <Text typo="caption">{directoryPath}</Text>
                    <Button
                        {...routes.myFiles({ path: directoryPath }).link}
                        doOpenNewTabIfHref={false}
                    >
                        Go
                    </Button>
                </div>
            ))}
        </div>
    );
}

/*
const { i18n } = declareComponentKeys<"page title" | "what this page is used for">()({
    MyFilesIndex
});
export type I18n = typeof i18n;
*/

const useStyles = tss.withName({ MyFilesIndex }).create({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    }
});
