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
import { customIcons } from "ui/theme";
import { useCoreState } from "core";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function ProjectSettings(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ ProjectSettings });

    const project = useCoreState("projectManagement", "currentProject");
    const availableProjects = useCoreState("projectManagement", "availableProjects");

    const groupProjectName = project.group === undefined ? undefined : project.name;

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.accountSvgUrl}
                title={t("page header title")}
                helpTitle={t("page header help title", { groupProjectName })}
                helpContent={t("page header help content", {
                    groupProjectName,
                    "doesUserBelongToSomeGroupProject": availableProjects.length !== 1
                })}
                helpIcon="sentimentSatisfied"
            />
            <Tabs
                className={classes.tabs}
                size="big"
                tabs={tabIds.map(tabId => ({ "id": tabId, "title": t(tabId) }))}
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
}

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
    "root": {
        "height": "100%",
        "overflow": "auto"
    },
    "tabs": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1]
    }
}));
