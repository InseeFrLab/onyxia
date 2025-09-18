import { memo } from "react";
import { SettingField } from "ui/shared/SettingField";
import { useCoreState, getCoreSync } from "core";
import { copyToClipboard } from "ui/tools/copyToClipboard";

export type Props = {
    className?: string;
};

export const ProjectSettingsSecurityInfosTab = memo((props: Props) => {
    const { className } = props;

    const {
        functions: { projectManagement }
    } = getCoreSync();

    const servicePassword = useCoreState("projectManagement", "servicePassword");
    const groupProjectName = useCoreState("projectManagement", "groupProjectName");

    return (
        <div className={className}>
            <SettingField
                type="service password"
                groupProjectName={groupProjectName}
                servicePassword={servicePassword}
                onRequestCopy={() => copyToClipboard(servicePassword)}
                onRequestServicePasswordRenewal={() =>
                    projectManagement.renewServicePassword()
                }
            />
        </div>
    );
});
