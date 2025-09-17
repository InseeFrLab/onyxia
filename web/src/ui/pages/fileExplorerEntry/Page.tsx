import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { declareComponentKeys, useTranslation, useResolveLocalizedString } from "ui/i18n";
import { env } from "env";
import { routes } from "ui/routes";
import { useCoreState } from "core";
import { FileExplorerDisabledDialog } from "./FileExplorerDisabledDialog";
import type { Link } from "type-route";
import { S3Entries } from "./S3Entries/S3Entries";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

const Page = withLoginEnforced(FileExplorerMaybeDisabled);
export default Page;

function FileExplorerMaybeDisabled() {
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");
    if (!isFileExplorerEnabled) {
        return <FileExplorerDisabledDialog />;
    }
    return <FileExplorerEntry />;
}

function FileExplorerEntry() {
    const { classes } = useStyles();

    const { t } = useTranslation({ FileExplorer: FileExplorerEntry });

    const indexedS3Locations = useCoreState("s3ConfigManagement", "indexedS3Locations");

    const { resolveLocalizedString } = useResolveLocalizedString({
        labelWhenMismatchingLanguage: false
    });

    if (indexedS3Locations.type === "user created s3 config") {
        routes["myFiles"]({ path: indexedS3Locations.directoryPath }).replace();
        return;
    }

    if (indexedS3Locations.locations.length < 2) {
        routes["myFiles"]({
            path: indexedS3Locations.locations[0].directoryPath
        }).replace();
        return;
    }

    const entries = indexedS3Locations.locations.map(location => ({
        type: location.type,
        directoryPath: location.directoryPath,
        ...(() => {
            switch (location.type) {
                case "bookmark":
                    return {
                        title: resolveLocalizedString(location.title),
                        description:
                            location.description !== undefined
                                ? resolveLocalizedString(location.description)
                                : undefined,
                        tags:
                            location.tags !== undefined
                                ? location.tags.map(tag => resolveLocalizedString(tag))
                                : undefined
                    };
                case "personal":
                    return {
                        title: t(`title ${location.type}`),
                        description: t(`description ${location.type}`),
                        tags: [t("tags", { type: location.type })]
                    };
                case "project":
                    return {
                        title: t(`title ${location.type}`, {
                            projectName: location.projectName
                        }),
                        description: t(`description ${location.type}`, {
                            projectName: location.projectName
                        }),
                        tags: [t("tags", { type: location.type })]
                    };
            }
        })()
    }));

    return (
        <div className={classes.root}>
            <PageHeader
                mainIcon={customIcons.filesSvgUrl}
                title={t("page title - file explorer")}
                helpTitle={t("what this page is used for - file explorer")}
                helpContent={t("help content", {
                    docHref: env.S3_DOCUMENTATION_LINK,
                    accountTabLink: routes.account({ tabId: "storage" }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
            />
            <S3Entries entries={entries} className={classes.body} />
        </div>
    );
}

const useStyles = tss.withName({ FileExplorerEntry }).create({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    },
    body: { overflow: "auto" }
});

const { i18n } = declareComponentKeys<
    | "page title - file explorer"
    | "what this page is used for - file explorer"
    | {
          K: "help content";
          P: {
              docHref: string;
              accountTabLink: Link;
          };
          R: JSX.Element;
      }
    | "title personal"
    | "description personal"
    | { K: "title project"; P: { projectName: string }; R: string }
    | { K: "description project"; P: { projectName: string }; R: string }
    | {
          K: "tags";
          P: { type: "project" | "personal" };
          R: string;
      }
>()({ FileExplorer: FileExplorerEntry });
export type I18n = typeof i18n;
