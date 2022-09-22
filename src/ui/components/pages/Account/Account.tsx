import { Tabs } from "onyxia-ui/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "./tabs/AccountIntegrationsTab";
import { useMemo } from "react";
import { createGroup } from "type-route";
import { routes } from "ui/routes";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useTranslation } from "ui/i18n";
import { AccountStorageTab } from "./tabs/AccountStorageTab";
import { AccountUserInterfaceTab } from "./tabs/AccountUserInterfaceTab";
import { PageHeader } from "ui/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { Route } from "type-route";
import { makeStyles } from "ui/theme";
import { declareComponentKeys } from "i18nifty";
import { AccountK8sTab } from "./tabs/AccountK8sTab";
import { useSelector } from "ui/coreApi";

Account.routeGroup = createGroup([routes.account]);

type PageRoute = Route<typeof Account.routeGroup>;

Account.getDoRequireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

export function Account(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Account });

    const availableDeploymentRegions = useSelector(
        state => state.deploymentRegion.availableDeploymentRegions,
    );
    const kubernetesServerUrl = availableDeploymentRegions[0].kubernetes?.url || "";

    const tabs = useMemo(
        () =>
            accountTabIds
                .filter(name => name !== "kubernetes" || kubernetesServerUrl)
                .map(id => ({ id, "title": t(id) })),
        [t],
    );

    const onRequestChangeActiveTab = useConstCallback((tabId: AccountTabId) =>
        routes.account({ tabId }).push(),
    );

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon="account"
                title={t("text1")}
                helpTitle={t("text2")}
                helpContent={t("text3")}
                helpIcon="sentimentSatisfied"
            />
            <Tabs
                className={classes.tabs}
                size="big"
                tabs={tabs}
                activeTabId={route.params.tabId}
                maxTabCount={5}
                onRequestChangeActiveTab={onRequestChangeActiveTab}
            >
                {(() => {
                    switch (route.params.tabId) {
                        case "infos":
                            return <AccountInfoTab />;
                        case "third-party-integration":
                            return <AccountIntegrationsTab />;
                        case "storage":
                            return <AccountStorageTab />;
                        case "user-interface":
                            return <AccountUserInterfaceTab />;
                        case "kubernetes":
                            return <AccountK8sTab />;
                    }
                })()}
            </Tabs>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    AccountTabId | "text1" | "text2" | "text3" | "personal tokens tooltip"
>()({ Account });

const useStyles = makeStyles({ "name": { Account } })(theme => ({
    "root": {
        "height": "100%",
        "overflow": "auto",
    },
    "tabs": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1],
    },
}));
