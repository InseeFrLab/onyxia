import { S3ProfileDetails as S3ProfileDetails_headless } from "ui/shared/codex/s3ProfileDialog/S3ProfileDetails";
import { S3ProfileForm as S3ProfileForm_headless } from "ui/shared/codex/s3ProfileDialog/S3ProfileForm";
import { type Evt } from "evt";
import { useEvt } from "evt/hooks/useEvt";
import { useState, type ReactNode } from "react";
import { withLoader } from "ui/tools/withLoader";
import { getCore, useCoreState, getCoreSync } from "core";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";

export type S3ProfileDialogProps = {
    evtOpen: Evt<"detail" | "create">;
};

export function S3ProfileDialog(props: S3ProfileDialogProps) {
    const { evtOpen } = props;

    const [activeView, setActiveView] = useState<
        "detail" | "create" | "edit" | undefined
    >(undefined);

    useEvt(
        ctx => {
            evtOpen.attach(ctx, setActiveView);
        },
        [evtOpen]
    );

    if (activeView === undefined) {
        return null;
    }

    return (
        <SideDialog
            title={(() => {
                switch (activeView) {
                    case "detail":
                        return "S3 Profile Detail";
                    case "create":
                        return "New Custom S3 Profile";
                    case "edit":
                        return "Edit Custom S3 Profile";
                }
            })()}
            onClose={() => setActiveView(undefined)}
        >
            {(() => {
                switch (activeView) {
                    case "detail":
                        return (
                            <S3ProfileDetails
                                onCreateNewProfile={() => setActiveView("create")}
                                onEdit={() => setActiveView("edit")}
                            />
                        );
                    case "create":
                    case "edit":
                        return (
                            <S3ProfileForm
                                isEdit={activeView === "edit"}
                                onClose={() => setActiveView(undefined)}
                            />
                        );
                }
            })()}
        </SideDialog>
    );
}

function SideDialog(props: {
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    const { children, title, onClose } = props;

    const { classes } = useStyles_SideDialog();

    return (
        <div className={classes.root}>
            <div className={classes.headingWrapper}>
                <Text typo="display heading">{title}</Text>
                <IconButton icon={getIconUrlByName("Close")} onClick={onClose} />
            </div>

            <div className={classes.childrenWrapper}>{children}</div>
        </div>
    );
}

const useStyles_SideDialog = tss.withName({ SideDialog }).create(({ theme }) => ({
    root: {
        position: "fixed",
        width: 600,
        top: theme.spacing(5),
        bottom: theme.spacing(5),
        right: 0,
        display: "flex",
        flexDirection: "column"
    },
    headingWrapper: {
        display: "flex",
        justifyContent: "space-between",
        borderBottom: `1px solid ${theme.colors.useCases.typography.textPrimary}`
    },
    childrenWrapper: {
        flex: 1,
        overflow: "auto"
    }
}));

const S3ProfileDetails = withLoader<{
    onCreateNewProfile: () => void;
    onEdit: () => void;
}>({
    loader: async () => {
        const core = await getCore();
        await core.functions.s3ProfilesDetailsUiController.load();
    },
    FallbackComponent: () => null,
    Component: ({ onCreateNewProfile, onEdit }) => {
        const mainView = useCoreState("s3ProfilesDetailsUiController", "mainView");

        const {
            functions: { s3ProfilesDetailsUiController }
        } = getCoreSync();

        return (
            <S3ProfileDetails_headless
                availableProfileNames={mainView.availableProfileNames}
                profileName={mainView.profileName}
                onSelectedProfileChange={
                    s3ProfilesDetailsUiController.updateSelectedS3Profile
                }
                onCreateNewProfile={onCreateNewProfile}
                onEdit={mainView.isReadonly ? undefined : onEdit}
                endpointUrl={mainView.endpointUrl}
                defaultRegion={mainView.defaultRegion}
                accessCredentials={
                    mainView.accessCredentials === undefined
                        ? undefined
                        : {
                              expirationTime: mainView.accessCredentials.expirationTime,
                              accessKeyId: mainView.accessCredentials.accessKeyId,
                              secretAccessKey: mainView.accessCredentials.secretAccessKey,
                              sessionToken: mainView.accessCredentials.sessionToken,
                              areTokensBeingRenewed:
                                  mainView.accessCredentials.areTokensBeingRenewed,
                              onRenewToken: mainView.accessCredentials.areTokensRenewable
                                  ? () => s3ProfilesDetailsUiController.renewTokens()
                                  : undefined
                          }
                }
                availableTechnologies={mainView.availableTechnologies}
                technology={mainView.technology}
                codeSippet={mainView.codeSnippet}
            />
        );
    }
});

const S3ProfileForm = withLoader<{
    isEdit: boolean;
    onClose: () => void;
}>({
    loader: async ({ isEdit }) => {
        const core = await getCore();
        core.functions.s3ProfilesCreationUiController.load({ isEdit });
    },
    FallbackComponent: () => null,
    Component: ({ onClose }) => {
        const mainView = useCoreState("s3ProfilesCreationUiController", "main");
        const {
            functions: { s3ProfilesCreationUiController }
        } = getCoreSync();

        return (
            <S3ProfileForm_headless
                profileName={{
                    value: mainView.formValues.profileName,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "profileName",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.profileName
                }}
                endpointUrl={{
                    value: mainView.formValues.url,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "url",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.url
                }}
                defaultRegion={{
                    value: mainView.formValues.region,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "region",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.region
                }}
                urlStyle={{
                    value: mainView.formValues.pathStyleAccess
                        ? "path"
                        : "virtual-hosted",
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "pathStyleAccess",
                            value: newValue === "path"
                        })
                }}
                isAnonymous={{
                    value: mainView.formValues.isAnonymous,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "isAnonymous",
                            value: newValue
                        })
                }}
                accessKeyId={{
                    value: mainView.formValues.accessKeyId,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "accessKeyId",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.accessKeyId
                }}
                secretAccessKey={{
                    value: mainView.formValues.secretAccessKey,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "secretAccessKey",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.secretAccessKey
                }}
                sessionToken={{
                    value: mainView.formValues.sessionToken,
                    onChange: newValue =>
                        s3ProfilesCreationUiController.changeValue({
                            key: "sessionToken",
                            value: newValue
                        }),
                    errorMessage: mainView.formValuesErrors.sessionToken
                }}
                onSubmit={(() => {
                    if (!mainView.isFormSubmittable) {
                        return undefined;
                    }

                    return async () => {
                        await s3ProfilesCreationUiController.submit();
                        onClose();
                    };
                })()}
                onCancel={onClose}
            />
        );
    }
});
