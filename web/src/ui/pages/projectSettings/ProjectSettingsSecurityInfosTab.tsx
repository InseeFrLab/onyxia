import { memo } from "react";
import { SettingField } from "ui/shared/SettingField";
import { useCore, useCoreState } from "core";
import { copyToClipboard } from "ui/tools/copyToClipboard";

export type Props = {
    className?: string;
};

export const ProjectSettingsSecurityInfosTab = memo((props: Props) => {
    const { className } = props;

    const { projectManagement } = useCore().functions;

    const servicePassword = useCoreState("projectManagement", "servicePassword");
    const project = useCoreState("projectManagement", "currentProject");

    return (
        <div className={className}>
            <SettingField
                type="service password"
                groupProjectName={project.group === undefined ? undefined : project.name}
                servicePassword={servicePassword}
                onRequestCopy={() => copyToClipboard(servicePassword)}
                onRequestServicePasswordRenewal={() =>
                    projectManagement.renewServicePassword()
                }
            />
        </div>
    );
});
