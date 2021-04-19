

import { Tabs } from "../../shared/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "./tabs/AccountIntegrationsTab";
import { useMemo } from "react";
import { createGroup } from "type-route";
import { routes } from "app/router";
import type { Route } from "type-route";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { AccountStorageTab } from "./tabs/AccountStorageTab";
import { PageHeader } from "app/components/shared/PageHeader";
import Tooltip from "@material-ui/core/Tooltip";
import { Icon } from "app/components/designSystem/Icon";
import { useConstCallback } from "powerhooks";

Account.routeGroup = createGroup([routes.account]);

Account.requireUserLoggedIn = true;

export type Props = {
    className?: string;
    //We allow route to be undefined to be able to test in storybook
    route: Route<typeof Account.routeGroup>;
};

const { useClassNames } = createUseClassNames()(
    () => ({
        "helpIcon": {
            "marginTop": -1, //TODO: Address globally
        }
    })
);

export function Account(props: Props) {

    const { className, route } = props;

    const { t } = useTranslation("Account");

    const tabs = useMemo(
        () => accountTabIds.map(id => ({ id, "title": t(id) })),
        [t]
    );

    const onRequestChangeActiveTab = useConstCallback(
        (tabId: AccountTabId) => routes.account({ tabId }).push()
    );

    const { classNames } = useClassNames({});

    return (
        <div className={className}>
            <PageHeader
                icon="account"
                text1={t("text1")}
                text2={t("text2")}
                text3={<>
                    {t("text3p1")}
                    &nbsp;
                    <strong>{t("personal tokens")}</strong>
                    &nbsp;
                    <Tooltip title={t("personal tokens tooltip")}>
                        <Icon
                            className={classNames.helpIcon}
                            type="help"
                            fontSize="small"
                        />
                    </Tooltip>
                    &nbsp;
                    {t("text3p2")}
                </>}
            />
            <Tabs
                size="big"
                tabs={tabs}
                activeTabId={route.params.tabId}
                maxTabCount={5}
                onRequestChangeActiveTab={onRequestChangeActiveTab}
            >
                {(() => {
                    switch (route.params.tabId) {
                        case "infos": return <AccountInfoTab />;
                        case "third-party-integration": return <AccountIntegrationsTab />;
                        case "storage": return <AccountStorageTab />;
                        case "user-interface": return null;
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
        text3p1: undefined;
        text3p2: undefined;
        'personal tokens': undefined;
        'personal tokens tooltip': undefined;
    };

}


