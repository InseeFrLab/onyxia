import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useMemo, useState } from "react";
import { Dialog } from "onyxia-ui/Dialog";
import { Evt } from "evt";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import {
    CreateOrRenameBookmarkDialog,
    type CreateOrRenameBookmarkDialogProps
} from "./CreateOrRenameBookmarkDialog";
import {
    DirectoryCreationDialog,
    type DirectoryCreationDialogProps
} from "./DirectoryCreationDialog";
import {
    MakePrefixPublicDialog,
    type MakePrefixPublicDialogProps,
    type PrefixPolicyAction
} from "./MakePrefixPublicDialog";
import {
    S3ShareObjectDialog,
    type S3ShareObjectDialogProps
} from "ui/shared/codex/S3ShareObjectDialog";
import { useS3DialogClasses } from "ui/shared/codex/S3DialogPrimitives";
import { DeleteSelectionDialog } from "ui/shared/codex/S3ExplorerMainView/S3ExplorerMainView";

const meta = {
    title: "Pages/S3 Explorer/Storage modals",
    parameters: {
        layout: "fullscreen"
    }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const prefixS3Uri = parsePrefixOrThrow("s3://marchufschmitt/edefede/untitled_folder/");
const objectUrl = "https://minio.lab.sspcloud.fr/garronej/good_fortnite_game/.DS_Store";
const signedObjectUrl =
    "https://minio.lab.sspcloud.fr/garronej/WhatsApp%20Image%202026-02-15%20at%2017.34.19.jpeg";
const signedUrl = [
    signedObjectUrl,
    "?X-Amz-Algorithm=AWS4-HMAC-SHA256",
    "&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD",
    "&X-Amz-Credential=X53J0VKTNO4PHEHSO3BG%2F20260604%2Fus-east-1%2Fs3%2Faws4_request",
    "&X-Amz-Date=20260604T085902Z",
    "&X-Amz-Expires=86400",
    `&X-Amz-Security-Token=${getLongSecurityToken()}`,
    "&X-Amz-Signature=efebd3e43c23cc0d59d39d4554e860dd55bf09c23f815190cf94080fce515faf",
    "&X-Amz-SignedHeaders=host",
    "&x-amz-checksum-mode=ENABLED",
    "&x-id=GetObject"
].join("");

export const AddBookmark: Story = {
    render: () => <OpenBookmarkDialog />
};

export const CreatePrefix: Story = {
    render: () => <OpenDirectoryCreationDialog />
};

export const SharePublicObject: Story = {
    render: () => (
        <ShareObjectModal
            isPublic={true}
            httpUrl={objectUrl}
            objectBasename=".DS_Store"
        />
    )
};

export const ShareSignedObject: Story = {
    render: () => (
        <ShareObjectModal
            isPublic={false}
            httpUrl={signedUrl}
            objectBasename="WhatsApp Image 2026-02-15 at 17.34.19.jpeg"
        />
    )
};

export const MakePrefixPublic: Story = {
    render: () => <OpenPrefixPolicyDialog action="make public" />
};

export const MakePrefixPrivate: Story = {
    render: () => <OpenPrefixPolicyDialog action="undo make public" />
};

export const DeleteSelection: Story = {
    render: () => (
        <DeleteSelectionDialog
            state={{
                items: [
                    {
                        type: "prefix segment",
                        s3Uri: prefixS3Uri,
                        displayName: "prefix-name",
                        uploadProgressPercent: undefined,
                        isDeleting: false,
                        policy: { isPublic: true }
                    },
                    {
                        type: "object",
                        s3Uri: parseObjectOrThrow(
                            "s3://marchufschmitt/edefede/untitled_folder/report.parquet"
                        ),
                        displayName: "report.parquet",
                        uploadProgressPercent: undefined,
                        isDeleting: false,
                        size: 1_400_000,
                        lastModified: new Date("2026-01-14T10:00:00Z").getTime()
                    }
                ]
            }}
            onClose={action("close")}
            onConfirm={action("delete")}
        />
    )
};

function getLongSecurityToken(): string {
    return [
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
        "eyJhY2Nlc3NLZXkiOiJYNTNKMFZLVE5PNFBIRUhTTzNCRyIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sImF1ZCI6WyJtaW5pby1kYXRhbm9kZSIsIm9ueXhpYSIsInBvbGFyaXMiLCJhY2NvdW50Il0sImVtYWlsIjoiamFuZS5kb2VAZXhhbXBsZS5vcmciLCJleHAiOjE3ODExNjY2MDksIm5hbWUiOiJKYW5lIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImphbmUiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGdyb3VwcyBlbWFpbCIsInR5cCI6IkJlYXJlciJ9",
        "QptTLB2BwHiYq10nwRlJ4qJpKRrPiTrZKM1kdYw8aEKQ3KKouAWddhlP45LW5reQwMMubHCI8cHwW7MNmblA"
    ].join(".");
}

function OpenBookmarkDialog() {
    const evtOpen = useMemo<CreateOrRenameBookmarkDialogProps["evtOpen"]>(
        () =>
            Evt.create<{
                s3Uri: S3Uri;
                currentDisplayName: string | undefined;
                resolveDoProceed: (
                    result:
                        | { doProceed: true; displayName: string }
                        | { doProceed: false }
                ) => void;
            }>(),
        []
    );

    useEffect(() => {
        evtOpen.post({
            s3Uri: prefixS3Uri,
            currentDisplayName: undefined,
            resolveDoProceed: action("bookmarkDialogResult")
        });
    }, [evtOpen]);

    return <CreateOrRenameBookmarkDialog evtOpen={evtOpen} />;
}

function OpenDirectoryCreationDialog() {
    const evtOpen = useMemo<DirectoryCreationDialogProps["evtOpen"]>(
        () =>
            Evt.create<{
                exclude: string[];
                resolveDoProceed: (
                    result:
                        | { doProceed: true; prefixSegment: string }
                        | { doProceed: false }
                ) => void;
            }>(),
        []
    );

    useEffect(() => {
        evtOpen.post({
            exclude: [],
            resolveDoProceed: action("directoryCreationDialogResult")
        });
    }, [evtOpen]);

    return <DirectoryCreationDialog evtOpen={evtOpen} />;
}

function OpenPrefixPolicyDialog(props: { action: PrefixPolicyAction }) {
    const { action: policyAction } = props;

    const evtOpen = useMemo<MakePrefixPublicDialogProps["evtOpen"]>(
        () =>
            Evt.create<{
                s3Uri: S3Uri.TerminatedByDelimiter;
                action?: PrefixPolicyAction;
                resolveDoProceed: (doProceed: boolean) => void;
            }>(),
        []
    );

    useEffect(() => {
        evtOpen.post({
            s3Uri: prefixS3Uri,
            action: policyAction,
            resolveDoProceed: action("prefixPolicyDialogResult")
        });
    }, [evtOpen, policyAction]);

    return <MakePrefixPublicDialog evtOpen={evtOpen} />;
}

function ShareObjectModal(
    props:
        | (Pick<
              S3ShareObjectDialogProps.Public,
              "isPublic" | "httpUrl" | "objectBasename"
          > & {
              isPublic: true;
          })
        | (Pick<
              S3ShareObjectDialogProps.Private,
              "isPublic" | "httpUrl" | "objectBasename"
          > & {
              isPublic: false;
          })
) {
    const dialogClasses = useS3DialogClasses();
    const [validityDuration, setValidityDuration] =
        useState<S3ShareObjectDialogProps.ValidityDuration>("one day");

    return (
        <Dialog
            isOpen={true}
            onClose={action("close")}
            className={dialogClasses.paper}
            maxWidth={false}
            muiDialogClasses={{ root: dialogClasses.overlayRoot }}
            title="Share object"
            classes={{
                title: dialogClasses.title,
                body: dialogClasses.body,
                buttons: dialogClasses.hiddenButtons
            }}
            body={
                props.isPublic ? (
                    <S3ShareObjectDialog {...props} />
                ) : (
                    <S3ShareObjectDialog
                        {...props}
                        validityDuration={validityDuration}
                        changeValidityDuration={({ validityDuration }) => {
                            action("changeValidityDuration")(validityDuration);
                            setValidityDuration(validityDuration);
                        }}
                    />
                )
            }
            buttons={<></>}
        />
    );
}

function parsePrefixOrThrow(value: string): S3Uri.TerminatedByDelimiter {
    const s3Uri = parseS3Uri({
        value,
        delimiter: "/"
    });

    if (!s3Uri.isDelimiterTerminated) {
        throw new Error(`Expected a delimiter-terminated S3 URI: ${value}`);
    }

    return s3Uri;
}

function parseObjectOrThrow(value: string): S3Uri.NonTerminatedByDelimiter {
    const s3Uri = parseS3Uri({
        value,
        delimiter: "/"
    });

    if (s3Uri.isDelimiterTerminated) {
        throw new Error(`Expected a non delimiter-terminated S3 URI: ${value}`);
    }

    return s3Uri;
}
