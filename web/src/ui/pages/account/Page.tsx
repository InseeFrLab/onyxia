import { Suspense, lazy } from "react";
import { Tabs } from "onyxia-ui/Tabs";
import { type AccountTabId, accountTabIds } from "./accountTabIds";
import { useMemo } from "react";
import { routes, getRoute } from "ui/routes";
import { routeGroup } from "./route";
import { useTranslation } from "ui/i18n";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useCore } from "core";
import { assert, type Equals } from "tsafe/assert";
import { getIconUrlByName, customIcons } from "lazy-icons";
import { withLoginEnforced } from "ui/shared/withLoginEnforced";

const Page = withLoginEnforced(Account);
export default Page;

const AccountGitTab = lazy(() => import("./AccountGitTab"));
const AccountKubernetesTab = lazy(() => import("./AccountKubernetesTab"));
const AccountProfileTab = lazy(() => import("./AccountProfileTab"));
const AccountStorageTab = lazy(() => import("./AccountStorageTab"));
const AccountUserInterfaceTab = lazy(() => import("./AccountUserInterfaceTab"));
const AccountVaultTab = lazy(() => import("./AccountVaultTab"));

function Account() {
    const route = getRoute();
    assert(routeGroup.has(route));

    const { t } = useTranslation({ Account });

    const { s3CodeSnippets, k8sCodeSnippets, vaultCredentials } = useCore().functions;

    const tabs = useMemo(
        () =>
            accountTabIds
                .filter(accountTabId =>
                    accountTabId !== "storage" ? true : s3CodeSnippets.isAvailable()
                )
                .filter(accountTabId =>
                    accountTabId !== "k8sCodeSnippets"
                        ? true
                        : k8sCodeSnippets.getIsAvailable()
                )
                .filter(accountTabId =>
                    accountTabId !== "vault" ? true : vaultCredentials.isAvailable()
                )
                .map(id => ({ id, title: t(id) })),
        [t]
    );

    const onRequestChangeActiveTab = useConstCallback((tabId: AccountTabId) =>
        routes.account({ tabId }).push()
    );

    const { classes } = useStyles();

    return (
        <div className={classes.root}>
            <PageHeader
                mainIcon={customIcons.accountSvgUrl}
                title={t("text1")}
                helpTitle={t("text2")}
                helpContent={t("text3")}
                helpIcon={getIconUrlByName("SentimentSatisfied")}
            />
            <Tabs
                className={classes.tabs}
                size="big"
                tabs={tabs}
                activeTabId={route.params.tabId}
                maxTabCount={5}
                onRequestChangeActiveTab={onRequestChangeActiveTab}
            >
                <Suspense>
                    {(() => {
                        switch (route.params.tabId) {
                            case "profile":
                                return <AccountProfileTab />;
                            case "git":
                                return <AccountGitTab />;
                            case "storage":
                                return <AccountStorageTab />;
                            case "user-interface":
                                return <AccountUserInterfaceTab />;
                            case "k8sCodeSnippets":
                                return <AccountKubernetesTab />;
                            case "vault":
                                return <AccountVaultTab />;
                        }
                        assert<Equals<typeof route.params.tabId, never>>(false);
                    })()}
                </Suspense>
            </Tabs>
        </div>
    );
}

const { i18n } = declareComponentKeys<
    AccountTabId | "text1" | "text2" | "text3" | "personal tokens tooltip"
>()({
    Account
});
export type I18n = typeof i18n;

const useStyles = tss.withName({ Account }).create(({ theme }) => ({
    root: {
        height: "100%",
        overflow: "auto"
    },
    tabs: {
        borderRadius: 8,
        boxShadow: theme.shadows[1]
    }
}));
