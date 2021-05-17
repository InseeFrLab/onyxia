
import { useState, useMemo, useEffect, memo } from "react";
import {
    CatalogLauncherAdvancedConfigurationHeader,
    Props as CatalogLauncherAdvancedConfigurationHeaderProps
} from "./CatalogLauncherAdvancedConfigurationHeader";
import { Tabs } from "app/components/shared/Tabs";
import {
    CatalogLauncherAdvancedConfigurationTab,
    Props as CatalogLauncherAdvancedConfigurationTabProps
} from "./CatalogLauncherAdvancedConfigurationTab";
import { useCallbackFactory } from "powerhooks";
import type { Param0 } from "tsafe";
import { JsonEditor } from "jsoneditor-react";
import "jsoneditor-react/es/editor.min.css";

export type Props = {
    className?: string;
    formFieldsByTab: Record<
        string,
        CatalogLauncherAdvancedConfigurationTabProps["formFields"]
    >;
    onFormValueChange(
        params: {
            tabId: string;
            label: string;
            value: string | boolean;
        }
    ): void;
    contract: undefined | Record<string, unknown>;
    loadOrRefreshContract(): void;
};

export const CatalogLauncherConfigurationCard = memo((props: Props) => {

    const { 
        className, formFieldsByTab, 
        onFormValueChange, contract,
        loadOrRefreshContract
    } = props;


    const [state, setState] = useState<CatalogLauncherAdvancedConfigurationHeaderProps["state"]>("collapsed");

    useEffect(
        ()=> {
            if( state === "contract"){
                loadOrRefreshContract();
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state]
    );

    const tabs = useMemo(
        () => Object.keys(formFieldsByTab)
            .map(title => ({ "id": title, title })),
        [formFieldsByTab]
    );

    const [activeTabId, setActiveTabId] = useState(
        () => tabs[0].id
    );

    const onFormValueChangeFactory = useCallbackFactory(
        (
            [tabId]: [string],
            [{ label, value }]: [
                Param0<
                    CatalogLauncherAdvancedConfigurationTabProps["onFormValueChange"]
                >
            ]
        ) =>
            onFormValueChange({
                tabId,
                label,
                value
            })
    );

    return (
        <div className={className}>
            <CatalogLauncherAdvancedConfigurationHeader
                state={state}
                onStateChange={setState}
            />
            <Tabs
                tabs={tabs}
                activeTabId={activeTabId}
                onRequestChangeActiveTab={setActiveTabId}
                size="small"
                maxTabCount={5}
            >
                {(() => {
                    switch (state) {
                        case "collapsed":
                            return null;
                        case "contract":
                            return <JsonEditor value={contract}/>;
                        case "form":
                            return (
                                <CatalogLauncherAdvancedConfigurationTab
                                    formFields={formFieldsByTab[activeTabId]}
                                    onFormValueChange={onFormValueChangeFactory(activeTabId)}
                                />
                            );
                    }
                })()}
            </Tabs>
        </div>
    );

});


