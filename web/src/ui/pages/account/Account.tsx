import { Tabs } from "onyxia-ui/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "./tabs/AccountIntegrationsTab";
import { AccountKubernetesTab } from "./tabs/AccountKubernetesTab";
import { AccountVaultTab } from "./tabs/AccountVaultTab";
import { useMemo } from "react";
import { routes } from "ui/routes";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useTranslation } from "ui/i18n";
import { AccountStorageTab } from "./tabs/AccountStorageTab";
import { AccountUserInterfaceTab } from "./tabs/AccountUserInterfaceTab";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useCore } from "core";
import { assert, type Equals } from "tsafe/assert";
import type { PageRoute } from "./route";
import { customIcons } from "ui/theme";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function Account(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ Account });

    const { s3Credentials, k8sCredentials, vaultCredentials } = useCore().functions;

    const tabs = useMemo(
        () =>
            accountTabIds
                .filter(accountTabId =>
                    accountTabId !== "storage" ? true : s3Credentials.isAvailable()
                )
                .filter(accountTabId =>
                    accountTabId !== "k8sCredentials"
                        ? true
                        : k8sCredentials.getIsAvailable()
                )
                .filter(accountTabId =>
                    accountTabId !== "vault" ? true : vaultCredentials.isAvailable()
                )
                .map(id => ({ id, "title": t(id) })),
        [t]
    );

    const onRequestChangeActiveTab = useConstCallback((tabId: AccountTabId) =>
        routes.account({ tabId }).push()
    );

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.accountSvgUrl}
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
                        case "k8sCredentials":
                            return <AccountKubernetesTab />;
                        case "vault":
                            return <AccountVaultTab />;
                    }
                    assert<Equals<typeof route.params.tabId, never>>(false);
                })()}
            </Tabs>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    AccountTabId | "text1" | "text2" | "text3" | "personal tokens tooltip"
>()({
    Account
});

const useStyles = tss.withName({ Account }).create(({ theme }) => ({
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
