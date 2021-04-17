

import { Tabs } from "../../shared/Tabs";
import { AccountInfoTab } from "./AccountInfoTab";
import { useMemo, useState } from "react";
import { createGroup } from "type-route";
import { routes } from "app/router";
import type { Route } from "type-route";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useEffectOnValueChange } from "powerhooks";
import { useTranslation } from "app/i18n/useTranslations";

Account.routeGroup = createGroup([routes.account]);

Account.requireUserLoggedIn = false;

export type Props = {
    className?: string;
    //We allow route to be undefined to be able to test in storybook
    route?: Route<typeof Account.routeGroup>;
};

export function Account(props: Props) {

    const {
        className,
        route
    } = props;

    const { t } = useTranslation("Account");

    const [selectedTabId, setSelectedTabId] = useState<AccountTabId>(() =>
        route?.params?.accountTab ?? accountTabIds[0]
    );

    useEffectOnValueChange(
        () => {

            if (route === undefined) return;

            routes.account({ accountTab: selectedTabId }).push();

        },
        [selectedTabId]
    );

    const tabs = useMemo(
        () => accountTabIds.map(id => ({ id, "title": t(id) })),
        [t]
    );

    return (
        <div className={className}>

            <Tabs
                size="small"
                tabs={tabs}
                selectedTabId={selectedTabId}
                maxTabCount={5}
                onRequestChangeActiveTab={setSelectedTabId}
            />
            {
                (() => {
                    switch (selectedTabId) {
                        case "account-info": return <AccountInfoTab />;
                    }
                })()
            }
        </div>
    );

}

export declare namespace Account {

    export type I18nScheme = Record<AccountTabId, undefined>;

}


