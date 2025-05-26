import { tss } from "tss";
import type { PageRoute } from "./route";
import { PageHeader } from "onyxia-ui/PageHeader";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { env } from "env";
import { routes } from "ui/routes";
import { useCoreState, useCore } from "core";
import { MyFilesDisabledDialog } from "../myFiles/MyFilesDisabledDialog";
import type { Link } from "type-route";
import { Datasource } from "./Datasource";
import Grid from "@mui/material/Grid2";

type Props = {
    route: PageRoute;
    className?: string;
};

export default function FileExplorerMaybeDisabled(props: Props) {
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");
    if (!isFileExplorerEnabled) {
        return <MyFilesDisabledDialog />;
    }
    return <FileExplorer {...props} />;
}

function FileExplorer(props: Props) {
    const { className, route } = props;
    const { classes, cx } = useStyles();

    const { t } = useTranslation({ FileExplorer });

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.filesSvgUrl}
                title={t("page title - my files")}
                helpTitle={t("what this page is used for - my files")}
                helpContent={t("help content", {
                    docHref: env.S3_DOCUMENTATION_LINK,
                    accountTabLink: routes.account({ tabId: "storage" }).link
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
                // titleCollapseParams={titleCollapseParams}
                // helpCollapseParams={helpCollapseParams}
            />
            <Grid container spacing={2}>
                {[
                    {
                        id: "1",
                        title: "Données personnelles",
                        description: "Vos propres fichiers et jeux de données.",
                        path: "s3://projet/user/john",
                        type: "personal" as const
                    },
                    {
                        id: "2",
                        title: "Projet X",
                        description: "Sources de données partagées pour l'équipe X.",
                        path: "s3://projet-x/shared",
                        type: "group" as const
                    },
                    {
                        id: "3",
                        title: "Catalogue Insee",
                        description: "Sources publiques ajoutées par l'administration.",
                        path: "s3://admin/catalogue",
                        type: "admin" as const
                    },
                    {
                        id: "4",
                        title: "Ajout manuel",
                        description: "Source ajoutée depuis vos paramètres.",
                        path: "s3://custom/user/datasource",
                        type: "custom" as const
                    }
                ].map((datasource, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        <Datasource {...datasource} />
                    </Grid>
                ))}
            </Grid>
        </div>
    );
}

const useStyles = tss.withName({ FileExplorer }).create({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    }
});

const { i18n } = declareComponentKeys<
    | "page title - my files"
    | "what this page is used for - my files"
    | {
          K: "help content";
          P: {
              docHref: string;
              accountTabLink: Link;
          };
          R: JSX.Element;
      }
>()({ FileExplorer });
export type I18n = typeof i18n;
