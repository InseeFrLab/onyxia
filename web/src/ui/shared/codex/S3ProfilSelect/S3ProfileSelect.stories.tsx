import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useMemo, useState } from "react";
import { S3ProfileSelect, type S3ProfileSelectProps } from "./S3ProfileSelect";

type Profile = S3ProfileSelectProps["selectedProfile"];

type StatefulProps = S3ProfileSelectProps & {
    profiles: Profile[];
};

const meta = {
    title: "Shared/S3ProfileSelect",
    component: S3ProfileSelect
} satisfies Meta<typeof S3ProfileSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulS3ProfileSelect(props: StatefulProps) {
    const { profiles, selectedProfile: selectedProfileProp, ...rest } = props;
    const [selectedProfile, setSelectedProfile] = useState(selectedProfileProp);

    useEffect(() => {
        setSelectedProfile(selectedProfileProp);
    }, [selectedProfileProp]);

    const profileByName = useMemo(
        () => new Map(profiles.map(profile => [profile.name, profile])),
        [profiles]
    );

    return (
        <S3ProfileSelect
            {...rest}
            selectedProfile={selectedProfile}
            onSelectedProfileChange={params => {
                rest.onSelectedProfileChange(params);
                const next = profileByName.get(params.profileName);
                if (next) {
                    setSelectedProfile(next);
                }
            }}
        />
    );
}

const baseProfiles: Profile[] = [
    {
        name: "Organisation Data Lake",
        url: "https://s3.eu-west-1.example.com/org-data/",
        isReadonly: true
    },
    {
        name: "Personal Sandbox",
        url: "https://s3.eu-west-1.example.com/personal-sandbox/",
        isReadonly: false
    },
    {
        name: "Analytics Exports",
        url: "https://s3.eu-west-1.example.com/analytics/exports/",
        isReadonly: false
    },
    {
        name: "Shared Compliance Archive",
        url: "https://s3.eu-west-1.example.com/compliance/archive/",
        isReadonly: true
    }
];

const baseArgs: S3ProfileSelectProps = {
    availableProfileNames: baseProfiles.map(profile => profile.name),
    readonlyProfileNames: baseProfiles
        .filter(profile => profile.isReadonly)
        .map(profile => profile.name),
    selectedProfile: baseProfiles[1],
    onSelectedProfileChange: action("selectedProfileChange"),
    onEditProfile: action("editProfile"),
    onCreateNewProfile: action("createNewProfile")
};

export const Default: Story = {
    args: {
        ...baseArgs
    },
    render: args => <StatefulS3ProfileSelect {...args} profiles={baseProfiles} />
};

export const ReadonlySelected: Story = {
    args: {
        ...baseArgs,
        selectedProfile: baseProfiles[0]
    },
    render: args => <StatefulS3ProfileSelect {...args} profiles={baseProfiles} />
};

const longProfiles: Profile[] = [
    {
        name: "My Extremely Long S3 Profile Name That Should Truncate Gracefully",
        url: "https://s3.eu-west-1.example.com/very/long/path/that/keeps/going/on/and/on/",
        isReadonly: false
    },
    {
        name: "Readonly Service Account With Extra Permissions",
        url: "https://s3.eu-west-1.example.com/readonly/service/account/",
        isReadonly: true
    }
];

export const LongNames: Story = {
    args: {
        availableProfileNames: longProfiles.map(profile => profile.name),
        readonlyProfileNames: longProfiles
            .filter(profile => profile.isReadonly)
            .map(profile => profile.name),
        selectedProfile: longProfiles[0],
        onSelectedProfileChange: action("selectedProfileChange"),
        onEditProfile: action("editProfile"),
        onCreateNewProfile: action("createNewProfile")
    },
    render: args => <StatefulS3ProfileSelect {...args} profiles={longProfiles} />
};
