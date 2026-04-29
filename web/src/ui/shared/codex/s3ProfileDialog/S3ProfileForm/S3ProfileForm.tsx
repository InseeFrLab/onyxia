type ErrorId =
    | "must be an url"
    | "is required"
    | "not a valid access key id"
    | "profile name already used";

export type Props = {
    className?: string;

    profileName: {
        value: string;
        onChange: (newValue: string) => void;
        errorMessage: ErrorId | undefined;
    };

    endpointUrl: {
        value: string;
        onChange: (newValue: string) => void;
        errorMessage: ErrorId | undefined;
    };

    defaultRegion: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    urlStyle: {
        value: "path" | "virtual-hosted";
        onChange: (newValue: "path" | "virtual-hosted") => void;
    };

    isAnonymous: {
        value: boolean;
        onChange: (newValue: boolean) => void;
    };

    accessKeyId: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    secretAccessKey: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    sessionToken: {
        value: string | undefined;
        onChange: (newValue: string | undefined) => void;
        errorMessage: ErrorId | undefined;
    };

    onSubmit: (() => void) | undefined;

    onCancel: () => void;
};

export function S3ProfileForm(_props: Props) {
    return null;
}
