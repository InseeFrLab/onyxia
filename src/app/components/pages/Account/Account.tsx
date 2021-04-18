

import { Tabs } from "../../shared/Tabs";
import { AccountInfoTab } from "./tabs/AccountInfoTab";
import { useMemo, useState } from "react";
import { createGroup } from "type-route";
import { routes } from "app/router";
import type { Route } from "type-route";
import { accountTabIds } from "./accountTabIds";
import type { AccountTabId } from "./accountTabIds";
import { useEffectOnValueChange } from "powerhooks";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { PageHeader } from "app/components/shared/PageHeader";
import Tooltip from "@material-ui/core/Tooltip";
import { Icon } from "app/components/designSystem/Icon";

Account.routeGroup = createGroup([routes.account]);

Account.requireUserLoggedIn = true;

export type Props = {
    className?: string;
    //We allow route to be undefined to be able to test in storybook
    route?: Route<typeof Account.routeGroup>;
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

    const { classNames } = useClassNames({});

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
                selectedTabId={selectedTabId}
                maxTabCount={5}
                onRequestChangeActiveTab={setSelectedTabId}
            >
                {(() => {
                    switch (selectedTabId) {
                        case "account-info": return <AccountInfoTab />;
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


