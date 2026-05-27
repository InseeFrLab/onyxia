import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useMemo, useState } from "react";
import {
    getCodeSnippet,
    technologies,
    type Technology
} from "core/usecases/s3ProfilesDetailsUiController/decoupledLogic/codeSnippets";
import { S3ProfileDetails, type Props } from "./S3ProfileDetails";

type ProfileFixture = {
    profileName: string;
    endpointUrl: string;
    defaultRegion: string | undefined;
    isReadonly: boolean;
    accessCredentials: Props["accessCredentials"];
};

const profileFixtures: ProfileFixture[] = [
    {
        profileName: "S3 Default Profile",
        endpointUrl: "https://s3.eu-west-1.amazonaws.com",
        defaultRegion: "eu-west-1",
        isReadonly: true,
        accessCredentials: {
            expirationTime: Date.now() + 1000 * 60 * 60 * 4,
            accessKeyId: "ASIAIOSFODNN7EXAMPLE",
            secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            sessionToken: "IQoJb3JpZ2luX2VjEOr//////////wEaCXVzLWVhc3QtMSJHMEUCIDbN",
            areTokensBeingRenewed: false,
            onRenewToken: action("renewToken")
        }
    },
    {
        profileName: "Personal Sandbox",
        endpointUrl: "https://minio.lab.example.net",
        defaultRegion: undefined,
        isReadonly: false,
        accessCredentials: {
            expirationTime: undefined,
            accessKeyId: "sandbox-access-key-01j6vh2k1c2mf18q5m8q9q",
            secretAccessKey: "sandbox-secret-key-nhWps2sKgwX9Tn0bkWmju90Ax7g3sU2dbD",
            sessionToken: undefined,
            areTokensBeingRenewed: false,
            onRenewToken: undefined
        }
    },
    {
        profileName: "Public Open Data",
        endpointUrl: "https://object.data.gouv.fr",
        defaultRegion: "us-east-1",
        isReadonly: true,
        accessCredentials: undefined
    }
];

const meta = {
    title: "Shared/Codex/S3ProfileDialog/S3ProfileDetails",
    component: S3ProfileDetails,
    decorators: [
        Story => (
            <div style={{ width: 430, maxWidth: "100vw", padding: 16 }}>
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof S3ProfileDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulS3ProfileDetails(props: Props & { profiles: ProfileFixture[] }) {
    const { profiles, ...initialProps } = props;
    const [profileName, setProfileName] = useState(initialProps.profileName);
    const [technology, setTechnology] = useState(initialProps.technology);

    useEffect(() => {
        setProfileName(initialProps.profileName);
    }, [initialProps.profileName]);

    useEffect(() => {
        setTechnology(initialProps.technology);
    }, [initialProps.technology]);

    const selectedProfile = getSelectedProfile({ profiles, profileName });

    const codeSnippet = useMemo(
        () =>
            getStoryCodeSnippet({
                profile: selectedProfile,
                technology
            }),
        [selectedProfile, technology]
    );

    return (
        <S3ProfileDetails
            {...initialProps}
            availableProfileNames={profiles.map(profile => profile.profileName)}
            profileName={selectedProfile.profileName}
            onSelectedProfileChange={params => {
                initialProps.onSelectedProfileChange(params);
                setProfileName(params.profileName);
            }}
            endpointUrl={selectedProfile.endpointUrl}
            defaultRegion={selectedProfile.defaultRegion}
            accessCredentials={selectedProfile.accessCredentials}
            onEdit={selectedProfile.isReadonly ? undefined : initialProps.onEdit}
            onDelete={selectedProfile.isReadonly ? undefined : initialProps.onDelete}
            technology={technology}
            onTechnologyChange={params => {
                initialProps.onTechnologyChange(params);
                setTechnology(params.technology);
            }}
            codeSnippet={codeSnippet}
        />
    );
}

function getSelectedProfile(params: {
    profiles: ProfileFixture[];
    profileName: string;
}): ProfileFixture {
    const { profiles, profileName } = params;
    const selectedProfile =
        profiles.find(profile => profile.profileName === profileName) ?? profiles[0];

    if (selectedProfile === undefined) {
        throw new Error("S3ProfileDetails story fixtures must not be empty");
    }

    return selectedProfile;
}

function getStoryCodeSnippet(params: {
    profile: ProfileFixture;
    technology: Technology;
}) {
    const { profile, technology } = params;

    return getCodeSnippet({
        technology,
        profileName: profile.profileName,
        endpointUrl: profile.endpointUrl,
        defaultRegion: profile.defaultRegion,
        accessCredentials:
            profile.accessCredentials === undefined
                ? undefined
                : {
                      accessKeyId: profile.accessCredentials.accessKeyId,
                      secretAccessKey: profile.accessCredentials.secretAccessKey,
                      sessionToken: profile.accessCredentials.sessionToken
                  }
    });
}

const defaultProfile = profileFixtures[0];
const defaultTechnology = technologies[0];

if (defaultProfile === undefined || defaultTechnology === undefined) {
    throw new Error("S3ProfileDetails story fixtures must not be empty");
}

const baseArgs: Props = {
    availableProfileNames: profileFixtures.map(profile => profile.profileName),
    profileName: defaultProfile.profileName,
    onSelectedProfileChange: action("selectedProfileChange"),
    onCreateNewProfile: action("createNewProfile"),
    onEdit: action("edit"),
    onDelete: action("delete"),
    endpointUrl: defaultProfile.endpointUrl,
    defaultRegion: defaultProfile.defaultRegion,
    accessCredentials: defaultProfile.accessCredentials,
    availableTechnologies: technologies,
    technology: defaultTechnology,
    onTechnologyChange: action("technologyChange"),
    codeSnippet: getStoryCodeSnippet({
        profile: defaultProfile,
        technology: defaultTechnology
    })
};

export const Default: Story = {
    args: baseArgs,
    render: args => <StatefulS3ProfileDetails {...args} profiles={profileFixtures} />
};

export const EditableProfile: Story = {
    args: {
        ...baseArgs,
        profileName: "Personal Sandbox"
    },
    render: args => <StatefulS3ProfileDetails {...args} profiles={profileFixtures} />
};

export const AnonymousProfile: Story = {
    args: {
        ...baseArgs,
        profileName: "Public Open Data"
    },
    render: args => <StatefulS3ProfileDetails {...args} profiles={profileFixtures} />
};
