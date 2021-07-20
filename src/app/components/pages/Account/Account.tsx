import { Tabs } from "../../shared/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "./tabs/AccountIntegrationsTab";
import { useMemo } from "react";
import { createGroup } from "type-route";
import { routes } from "app/routes/router";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useTranslation } from "app/i18n/useTranslations";
import { AccountStorageTab } from "./tabs/AccountStorageTab";
import { AccountUserInterfaceTab } from "./tabs/AccountUserInterfaceTab";
import { PageHeader } from "app/components/shared/PageHeader";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { Route } from "type-route";
import { makeStyles } from "app/theme";

Account.routeGroup = createGroup([routes.account]);

type PageRoute = Route<typeof Account.routeGroup>;

Account.requireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
    className?: string;
};

const useStyles = makeStyles()(theme => ({
    "tabs": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1],
    },
}));

export function Account(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation("Account");

    const tabs = useMemo(
        () => accountTabIds.map(id => ({ id, "title": t(id) })),
        [t],
    );

    const onRequestChangeActiveTab = useConstCallback((tabId: AccountTabId) =>
        routes.account({ tabId }).push(),
    );

    const { classes } = useStyles();

    return (
        <div className={className}>
            <PageHeader
                icon="account"
                text1={t("text1")}
                text2={t("text2")}
                text3={t("text3")}
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
                    }
                })()}
            </Tabs>
        </div>
    );
}

export declare namespace Account {
    export type I18nScheme = Record<AccountTabId, undefined> & {
        text1: undefined;
        text2: undefined;
        text3: undefined;
        "personal tokens tooltip": undefined;
    };
}
