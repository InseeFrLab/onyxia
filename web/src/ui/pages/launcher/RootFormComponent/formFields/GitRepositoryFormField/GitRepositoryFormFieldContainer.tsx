import { Fragment, useEffect, useState } from "react";
import { routes } from "ui/routes";
import { useCoreState, getCoreSync } from "core";
import { getFieldId } from "core/usecases/gitRepositoryFieldUiController";
import { ManageGitProviderDialog } from "ui/pages/account/AccountGitTab/AddGitProviderDialog";
import { ConfirmGitProviderRemovalDialog } from "ui/pages/account/AccountGitTab/ConfirmGitProviderRemovalDialog";
import { GitRepositoryFormField } from "./GitRepositoryFormField";

/** Binds the field to gitRepositoryFieldUiController, and the provider dialogs */
export function GitRepositoryFormFieldContainer(props: {
    className?: string;
    title: string;
    description: string | undefined;
    isReadonly: boolean;
    onRemove: (() => void) | undefined;
    helmValuesPath: (string | number)[];
}) {
    const { className, title, description, isReadonly, onRemove, helmValuesPath } = props;

    const {
        functions: {
            gitRepositoryFieldUiController: controller,
            gitAccountUiController,
            launcher
        }
    } = getCoreSync();

    const fieldId = getFieldId(helmValuesPath);

    const viewByFieldId = useCoreState("gitRepositoryFieldUiController", "viewByFieldId");

    // NOTE: After useCoreState: it subscribes in an effect too, before the field
    // gets initialized.
    useEffect(() => {
        const { cleanup } = controller.initialize({ helmValuesPath, isReadonly });

        return cleanup;
    }, [fieldId, isReadonly]);

    const manageProviderDialog = useCoreState(
        "gitAccountUiController",
        "manageProviderDialog"
    );

    const [providerToRemove, setProviderToRemove] = useState<
        { id: string; displayName: string } | undefined
    >(undefined);

    // NOTE: Not left open for the account page.
    useEffect(() => () => gitAccountUiController.closeManageProviderDialog(), []);

    const view = viewByFieldId[fieldId];

    // NOTE: Until initialized, the first render.
    if (view === undefined) {
        return null;
    }

    return (
        <Fragment>
            <GitRepositoryFormField
                className={className}
                title={title}
                description={description}
                onRemove={onRemove}
                view={view}
                accountGitHref={routes.account({ tabId: "git" }).href}
                onModeChange={mode => controller.changeMode({ fieldId, mode })}
                onProviderSelect={providerId =>
                    controller.selectProvider({ fieldId, providerId })
                }
                onSearchChange={search => controller.changeSearch({ fieldId, search })}
                onPickedRepositoryEdit={search =>
                    controller.editPickedRepository({ fieldId, search })
                }
                onRepositoryClear={() => controller.clearRepository({ fieldId })}
                onRepositoryPick={repository =>
                    controller.pickRepository({ fieldId, repository })
                }
                onMoreRepositoriesRequest={() =>
                    controller.requestMoreRepositories({ fieldId })
                }
                onUrlInputChange={urlInput =>
                    controller.changeUrlInput({ fieldId, urlInput })
                }
                onBranchChange={branch => controller.changeBranch({ fieldId, branch })}
                onBranchSearchChange={branchSearch =>
                    controller.changeBranchSearch({ fieldId, branchSearch })
                }
                onSignIn={launcher.signInToGitProvider}
                onManage={gitAccountUiController.openManageProviderDialog}
            />
            {manageProviderDialog.isOpen && (
                <ManageGitProviderDialog
                    view={manageProviderDialog}
                    onProviderChange={providerId =>
                        gitAccountUiController.openManageProviderDialog({ providerId })
                    }
                    onClose={gitAccountUiController.closeManageProviderDialog}
                    onSubmit={launcher.saveGitProvider}
                    onDelete={() => {
                        const { card } = manageProviderDialog;

                        gitAccountUiController.closeManageProviderDialog();

                        if (card.isAddedByUser) {
                            // NOTE: Confirmed first, it is removed as a whole.
                            setProviderToRemove({
                                id: card.id,
                                displayName: card.displayName
                            });
                            return;
                        }

                        launcher.removeGitCredentials({
                            providerId: card.id,
                            isAddedByUser: false
                        });
                    }}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            <ConfirmGitProviderRemovalDialog
                providerName={providerToRemove?.displayName}
                onClose={({ doProceed }) => {
                    if (doProceed && providerToRemove !== undefined) {
                        launcher.removeGitCredentials({
                            providerId: providerToRemove.id,
                            isAddedByUser: true
                        });
                    }
                    setProviderToRemove(undefined);
                }}
            />
        </Fragment>
    );
}
