import { Fragment, useEffect, useState } from "react";
import { routes } from "ui/routes";
import { useCoreState, getCoreSync } from "core";
import { getFieldId } from "core/usecases/gitRepositoryFieldUiController";
import { ManageGitForgeDialog } from "ui/pages/account/AccountGitTab/AddGitForgeDialog";
import { ConfirmGitForgeRemovalDialog } from "ui/pages/account/AccountGitTab/ConfirmGitForgeRemovalDialog";
import { GitRepositoryFormField } from "./GitRepositoryFormField";

/** Binds the field to gitRepositoryFieldUiController, and the forge dialogs */
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

    const manageForgeDialog = useCoreState("gitAccountUiController", "manageForgeDialog");

    const [forgeToRemove, setForgeToRemove] = useState<
        { id: string; displayName: string } | undefined
    >(undefined);

    // NOTE: Not left open for the account page.
    useEffect(() => () => gitAccountUiController.closeManageForgeDialog(), []);

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
                onForgeSelect={forgeId => controller.selectForge({ fieldId, forgeId })}
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
                onSignIn={launcher.signInToGitForge}
                onManage={gitAccountUiController.openManageForgeDialog}
            />
            {manageForgeDialog.isOpen && (
                <ManageGitForgeDialog
                    view={manageForgeDialog}
                    onForgeChange={forgeId =>
                        gitAccountUiController.openManageForgeDialog({ forgeId })
                    }
                    onClose={gitAccountUiController.closeManageForgeDialog}
                    onSubmit={launcher.saveGitForge}
                    onDelete={() => {
                        const { card } = manageForgeDialog;

                        gitAccountUiController.closeManageForgeDialog();

                        if (card.isAddedByUser) {
                            // NOTE: Confirmed first, it is removed as a whole.
                            setForgeToRemove({
                                id: card.id,
                                displayName: card.displayName
                            });
                            return;
                        }

                        launcher.removeGitCredentials({
                            forgeId: card.id,
                            isAddedByUser: false
                        });
                    }}
                    getPersonalAccessTokenCreationUrl={
                        gitAccountUiController.getPersonalAccessTokenCreationUrl
                    }
                />
            )}
            <ConfirmGitForgeRemovalDialog
                forgeName={forgeToRemove?.displayName}
                onClose={({ doProceed }) => {
                    if (doProceed && forgeToRemove !== undefined) {
                        launcher.removeGitCredentials({
                            forgeId: forgeToRemove.id,
                            isAddedByUser: true
                        });
                    }
                    setForgeToRemove(undefined);
                }}
            />
        </Fragment>
    );
}
