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
import { alpha } from "@mui/material/styles";

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
            <div
                className={classes.panel}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === "string" ? title : undefined}
            >
                <div className={classes.headingWrapper}>
                    <Text typo="object heading" className={classes.title}>
                        {title}
                    </Text>
                    <IconButton
                        className={classes.closeButton}
                        size="small"
                        icon={getIconUrlByName("Close")}
                        onClick={onClose}
                    />
                </div>

                <div className={classes.childrenWrapper}>{children}</div>
            </div>
        </div>
    );
}

const useStyles_SideDialog = tss.withName({ SideDialog }).create(({ theme }) => ({
    root: {
        position: "fixed",
        inset: 0,
        zIndex: theme.muiTheme.zIndex.modal,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
        padding: `${theme.spacing(5)}px ${theme.spacing(2)}px ${theme.spacing(2)}px`,
        boxSizing: "border-box",
        backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
        backdropFilter: "blur(1px)"
    },
    panel: {
        width: 430,
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 8,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[4]
    },
    headingWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        padding: `${theme.spacing(3)}px ${theme.spacing(3)}px ${theme.spacing(2)}px`,
        borderBottom: `1px solid ${theme.colors.useCases.typography.textPrimary}`
    },
    title: {
        minWidth: 0,
        color: theme.colors.useCases.typography.textPrimary
    },
    closeButton: {
        flex: "none"
    },
    childrenWrapper: {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        padding: `${theme.spacing(2.5)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
        boxSizing: "border-box"
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
                onTechnologyChange={s3ProfilesDetailsUiController.changeTechnology}
                codeSnippet={mainView.codeSnippet}
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
                isEditionOfAnExistingConfig={mainView.isEditionOfAnExistingConfig}
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
