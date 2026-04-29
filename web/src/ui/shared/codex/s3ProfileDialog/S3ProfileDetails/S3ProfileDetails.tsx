import type {
    Technology,
    CodeSnippet
} from "core/usecases/s3ProfilesDetailsUiController/decoupledLogic/codeSnippets";

export type Props = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];

    profileName: string;

    onSelectedProfileChange: (params: { profileName: string }) => void;

    onCreateNewProfile: () => void;

    onEdit: (() => void) | undefined;

    endpointUrl: string;
    defaultRegion: string | undefined;

    accessCredentials:
        | {
              expirationTime: number | undefined;
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              areTokensBeingRenewed: boolean;
              onRenewToken: (() => void) | undefined;
          }
        | undefined;

    availableTechnologies: readonly Technology[];
    technology: Technology;
    codeSippet: CodeSnippet;
};

export function S3ProfileDetails(_props: Props) {
    return null;
}
