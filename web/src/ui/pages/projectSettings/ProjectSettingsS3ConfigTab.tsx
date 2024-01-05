import { memo } from "react";
import { SettingField } from "ui/shared/SettingField";
import { useCore, useCoreState } from "core";
import { copyToClipboard } from "ui/tools/copyToClipboard";

export type Props = {
    className?: string;
};

export const ProjectSettingsS3ConfigTab = memo((props: Props) => {
    const { className } = props;

    const { projectManagement } = useCore().functions;

    return null;
});

function S3ConfigCard(props: {
    className?: string;
    url: string;
    region: string;
    workingDirectoryPath: string;
    credentials:
        | {
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
          }
        | undefined;
    pathStyleAccess: boolean;
    doUseForExplorer: boolean;
    doUseForInjection: boolean;
    onDelete: () => void;
    onDoUseForExplorerValueChange: (doUseForExplorer: boolean) => void;
    onDoUseForInjectionValueChange: (doUseForInjection: boolean) => void;
}) {
    const {
        className,
        url,
        region,
        workingDirectoryPath,
        credentials,
        pathStyleAccess,
        doUseForExplorer,
        doUseForInjection,
        onDelete,
        onDoUseForExplorerValueChange,
        onDoUseForInjectionValueChange
    } = props;

    return (
        <div className={className}>
            <div className="header">
                <div className="title">
                    <div className="url">{url}</div>
                    <div className="region">{region}</div>
                </div>
                {credentials !== undefined && (
                    <div className="delete-button" onClick={onDelete}>
                        <div className="icon">
                            <i className="fas fa-trash-alt"></i>
                        </div>
                    </div>
                )}
            </div>
            <div className="body">
                <div className="working-directory-path">{workingDirectoryPath}</div>
                <div className="credentials">
                    <div className="access-key-id">{credentials?.accessKeyId}</div>
                    <div className="secret-access-key">
                        {credentials?.secretAccessKey}
                    </div>
                    <div className="session-token">{credentials?.sessionToken}</div>
                </div>
                <div className="path-style-access">
                    <div className="label">path style access</div>
                    <div className="value">{pathStyleAccess ? "true" : "false"}</div>
                </div>
                <div className="do-use-for-explorer">
                    <div className="label">do use for explorer</div>
                    <div className="value">
                        <input
                            type="checkbox"
                            checked={doUseForExplorer}
                            onChange={event =>
                                onDoUseForExplorerValueChange(event.target.checked)
                            }
                        />
                    </div>
                </div>
                <div className="do-use-for-injection">
                    <div className="label">do use for injection</div>
                    <div className="value">
                        <input
                            type="checkbox"
                            checked={doUseForInjection}
                            onChange={event =>
                                onDoUseForInjectionValueChange(event.target.checked)
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
