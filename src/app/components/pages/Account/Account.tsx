

import { Tabs } from "../../shared/Tabs";
import type { Props as TabsProps } from "../../shared/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { useMemo } from "react";
import { createGroup } from "type-route";
import { routes, useRoute } from "app/router";
import type { Route } from "type-route";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { PageHeader } from "app/components/shared/PageHeader";
import Tooltip from "@material-ui/core/Tooltip";
import { Icon } from "app/components/designSystem/Icon";
import { useEffect } from "react";
import { useConstCallback } from "powerhooks";

Account.routeGroup = createGroup([routes.account]);

Account.requireUserLoggedIn = true;

export type Props = {
    className?: string;
    //We allow route to be undefined to be able to test in storybook
    route: Route<typeof Account.routeGroup>;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "helpIcon": {
            "marginTop": 1, //TODO: Address globally
            "marginLeft": theme.spacing(1)
        }
    })
);

export function Account(props: Props) {

    const { className } = props;

    const { t } = useTranslation("Account");

    const route = useRoute() as typeof props.route;

    useEffect(() => {

        if (route.params.tabId !== undefined) {
            return;
        }

        routes.account({ "tabId": accountTabIds[0] }).replace();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = useMemo(
        () => accountTabIds.map(id => ({ id, "title": t(id) })),
        [t]
    );

    const onRequestChangeActiveTab = useConstCallback<TabsProps<AccountTabId>["onRequestChangeActiveTab"]>(
        tabId => routes.account({ tabId }).push()
    );

    const { classNames } = useClassNames({});

    if (route.params.tabId === undefined) {
        return null;
    }

    return (
        <div className={className}>
            <PageHeader
                icon="account"
                text1={t("text1")}
                text2={t("text2")}
                text3={<>
                    {t("text3p1")}
                    <strong>{t("personal tokens")}</strong>
                    <Tooltip title={t("personal tokens tooltip")}>
                        <Icon
                            className={classNames.helpIcon}
                            type="help"
                            fontSize="small"
                        />
                    </Tooltip>
                    {t("text3p2")}
                </>}
            />
            <Tabs
                size="small"
                tabs={tabs}
                activeTabId={route.params.tabId}
                maxTabCount={5}
                onRequestChangeActiveTab={onRequestChangeActiveTab}
            >
                {(() => {
                    switch (route.params.tabId) {
                        case "infos": return <AccountInfoTab />;
                        case "third-party-integration": return null;
                        case "storage": return null;
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


