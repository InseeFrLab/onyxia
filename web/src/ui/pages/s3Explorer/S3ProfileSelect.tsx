type Props = {
    className?: string;
    profileName_selected: string;
    profileName_options: string[];
    onSelectedProfileNameChange: (props: { profileName: string }) => void;
    // Can be undefined because not all s3 profiles are editable.
    updateSelectedProfileName: (() => void) | undefined;
    createProfile: () => void;
};

export function S3ProfileSelect(props: Props) {
    return null;
}
