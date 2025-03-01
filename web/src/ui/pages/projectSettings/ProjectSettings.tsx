import { Tabs } from "onyxia-ui/Tabs";
import { type TabId, tabIds } from "./tabIds";
import { ProjectSettingsSecurityInfosTab } from "./ProjectSettingsSecurityInfosTab";
import { ProjectSettingsS3ConfigTab } from "./ProjectSettingsS3ConfigTab";
import { routes } from "ui/routes";
import { useTranslation } from "ui/i18n";
import { PageHeader } from "onyxia-ui/PageHeader";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { assert, type Equals } from "tsafe/assert";
import type { PageRoute } from "./route";
import { useCoreState } from "core";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

export type Props = {
    route: PageRoute;
    className?: string;
};

const ProjectSettings = withLoginEnforced((props: Props) => {
    const { className, route } = props;

    const { t } = useTranslation({ ProjectSettings });

    const groupProjectName = useCoreState("projectManagement", "groupProjectName");
    const doesUserBelongToSomeGroupProject = useCoreState(
        "projectManagement",
        "doesUserBelongToSomeGroupProject"
    );

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.accountSvgUrl}
                title={t("page header title")}
                helpTitle={t("page header help title", { groupProjectName })}
                helpContent={t("page header help content", {
                    groupProjectName,
                    doesUserBelongToSomeGroupProject
                })}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
            />
            <Tabs
                className={classes.tabs}
                size="big"
                tabs={tabIds.map(tabId => ({ id: tabId, title: t(tabId) }))}
                activeTabId={route.params.tabId}
                maxTabCount={5}
                onRequestChangeActiveTab={tabId =>
                    routes[route.name]({
                        ...route.params,
                        tabId
                    }).push()
                }
            >
                {(() => {
                    switch (route.params.tabId) {
                        case "security-info":
                            return <ProjectSettingsSecurityInfosTab />;
                        case "s3-configs":
                            return <ProjectSettingsS3ConfigTab />;
                    }
                    assert<Equals<typeof route.params.tabId, never>>(false);
                })()}
            </Tabs>
        </div>
    );
});

export default ProjectSettings;

const { i18n } = declareComponentKeys<
    | TabId
    | "page header title"
    | {
          K: "page header help title";
          P: {
              groupProjectName: string | undefined;
          };
      }
    | {
          K: "page header help content";
          P: {
              doesUserBelongToSomeGroupProject: boolean;
              groupProjectName: string | undefined;
          };
          R: JSX.Element;
      }
>()({
    ProjectSettings
});
export type I18n = typeof i18n;

const useStyles = tss.withName({ ProjectSettings }).create(({ theme }) => ({
    root: {
        height: "100%",
        overflow: "auto"
    },
    tabs: {
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: theme.shadows[1]
    }
}));
