
import { useState, useMemo, memo } from "react";
import { Tabs } from "app/components/shared/Tabs";
import {
    CatalogLauncherAdvancedConfigurationTab
} from "./CatalogLauncherAdvancedConfigurationTab";

import type {
    Props as CatalogLauncherAdvancedConfigurationTabProps
} from "./CatalogLauncherAdvancedConfigurationTab";
import { createUseClassNames } from "app/theme/useClassNames";
import { IconButton } from "app/components/designSystem/IconButton";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";
import { useConstCallback } from "powerhooks";
import type { FormField } from "lib/useCases/launcher";

export type Props = {
    className?: string;
    formFieldsByTab: { [tabName: string]: FormField[]; };
    onFormValueChange: CatalogLauncherAdvancedConfigurationTabProps["onFormValueChange"];
};

export const CatalogLauncherConfigurationCard = memo((props: Props) => {

    const {
        className, formFieldsByTab,
        onFormValueChange
    } = props;


    const [isCollapsed, setIsCollapsed] = useState(true);

    const tabs = useMemo(
        () => Object.keys(formFieldsByTab)
            .map(title => ({ "id": title, title })),
        [formFieldsByTab]
    );

    const onIsCollapsedValueChange = useConstCallback(
        () => setIsCollapsed(!isCollapsed)
    );

    const [activeTabId, setActiveTabId] = useState(tabs[0].id);

    return (
        <div className={className}>
            <Header
                isCollapsed={isCollapsed}
                onIsCollapsedValueChange={onIsCollapsedValueChange}
            />
            {!isCollapsed &&
                <Tabs
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onRequestChangeActiveTab={setActiveTabId}
                    size="small"
                    maxTabCount={5}
                >
                    <CatalogLauncherAdvancedConfigurationTab
                        formFields={formFieldsByTab[activeTabId]}
                        onFormValueChange={onFormValueChange}
                    />
                </Tabs>
            }
        </div>
    );

});

export declare namespace CatalogLauncherConfigurationCard {

    export type I18nScheme = {
        title: undefined;
    };
}


const { Header } = (() => {


    type Props = {
        className?: string;
        isCollapsed: boolean;
        onIsCollapsedValueChange(): void;
    };

    const { useClassNames } = createUseClassNames<{ isCollapsed: boolean; }>()(
        (theme, { isCollapsed }) => ({
            "root": {
                "display": "flex",
                "padding": theme.spacing(1, 3),
                "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces
            },
            "expandIcon": {
                "& svg": {
                    "transition": theme.transitions.create(
                        ["transform"],
                        { "duration": theme.transitions.duration.short }
                    ),
                    "transform": `rotate(${isCollapsed ? 0 : "-180deg"})`
                }
            },
            "title": {
                "display": "flex",
                "alignItems": "center"
            }
        })
    );

    const Header = memo(
        (props: Props) => {

            const { className, isCollapsed, onIsCollapsedValueChange } = props;

            const { t } = useTranslation("CatalogLauncherConfigurationCard");

            const { classNames } = useClassNames({ isCollapsed });


            return (
                <div className={cx(classNames.root, className)}>
                    <Typography
                        variant="h5"
                        className={classNames.title}
                    >
                        {t("title")}
                    </Typography>
                    <div style={{ "flex": 1 }} />
                    <IconButton
                        onClick={onIsCollapsedValueChange}
                        type="expandMore"
                        className={classNames.expandIcon}
                    />
                </div>
            );

        }
    );

    return { Header };


})();
