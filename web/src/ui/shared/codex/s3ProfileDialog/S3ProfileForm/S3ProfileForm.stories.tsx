import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import { S3ProfileForm, type ErrorId, type Props } from "./S3ProfileForm";

const meta = {
    title: "Shared/Codex/S3ProfileDialog/S3ProfileForm",
    component: S3ProfileForm,
    decorators: [
        Story => (
            <div
                style={{
                    width: 430,
                    maxWidth: "100vw",
                    height: 720,
                    padding: 16,
                    boxSizing: "border-box"
                }}
            >
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof S3ProfileForm>;

export default meta;

type Story = StoryObj<typeof meta>;
type FormValues = {
    profileName: string;
    endpointUrl: string;
    defaultRegion: string | undefined;
    urlStyle: Props["urlStyle"]["value"];
    isAnonymous: boolean;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    sessionToken: string | undefined;
};

type FormErrors = {
    [Key in keyof Omit<FormValues, "urlStyle" | "isAnonymous">]: ErrorId | undefined;
};

const defaultValues: FormValues = {
    profileName: "S3 Default Profile",
    endpointUrl: "https://seaweedfs.lab.sspcloud.fr",
    defaultRegion: "us-east-1",
    urlStyle: "virtual-hosted",
    isAnonymous: false,
    accessKeyId: "ASIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    sessionToken: undefined
};

const emptyErrors: FormErrors = {
    profileName: undefined,
    endpointUrl: undefined,
    defaultRegion: undefined,
    accessKeyId: undefined,
    secretAccessKey: undefined,
    sessionToken: undefined
};

const baseArgs: Props = createProps({
    values: defaultValues,
    errors: emptyErrors,
    isEditionOfAnExistingConfig: true,
    isSubmittable: true
});

function StatefulS3ProfileForm(props: Props) {
    const [values, setValues] = useState<FormValues>({
        profileName: props.profileName.value,
        endpointUrl: props.endpointUrl.value,
        defaultRegion: props.defaultRegion.value,
        urlStyle: props.urlStyle.value,
        isAnonymous: props.isAnonymous.value,
        accessKeyId: props.accessKeyId.value,
        secretAccessKey: props.secretAccessKey.value,
        sessionToken: props.sessionToken.value
    });

    useEffect(() => {
        setValues({
            profileName: props.profileName.value,
            endpointUrl: props.endpointUrl.value,
            defaultRegion: props.defaultRegion.value,
            urlStyle: props.urlStyle.value,
            isAnonymous: props.isAnonymous.value,
            accessKeyId: props.accessKeyId.value,
            secretAccessKey: props.secretAccessKey.value,
            sessionToken: props.sessionToken.value
        });
    }, [
        props.profileName.value,
        props.endpointUrl.value,
        props.defaultRegion.value,
        props.urlStyle.value,
        props.isAnonymous.value,
        props.accessKeyId.value,
        props.secretAccessKey.value,
        props.sessionToken.value
    ]);

    return (
        <S3ProfileForm
            {...props}
            profileName={{
                ...props.profileName,
                value: values.profileName,
                onChange: newValue => {
                    props.profileName.onChange(newValue);
                    setValues(values => ({ ...values, profileName: newValue }));
                }
            }}
            endpointUrl={{
                ...props.endpointUrl,
                value: values.endpointUrl,
                onChange: newValue => {
                    props.endpointUrl.onChange(newValue);
                    setValues(values => ({ ...values, endpointUrl: newValue }));
                }
            }}
            defaultRegion={{
                ...props.defaultRegion,
                value: values.defaultRegion,
                onChange: newValue => {
                    props.defaultRegion.onChange(newValue);
                    setValues(values => ({ ...values, defaultRegion: newValue }));
                }
            }}
            urlStyle={{
                ...props.urlStyle,
                value: values.urlStyle,
                onChange: newValue => {
                    props.urlStyle.onChange(newValue);
                    setValues(values => ({ ...values, urlStyle: newValue }));
                }
            }}
            isAnonymous={{
                ...props.isAnonymous,
                value: values.isAnonymous,
                onChange: newValue => {
                    props.isAnonymous.onChange(newValue);
                    setValues(values => ({ ...values, isAnonymous: newValue }));
                }
            }}
            accessKeyId={{
                ...props.accessKeyId,
                value: values.accessKeyId,
                onChange: newValue => {
                    props.accessKeyId.onChange(newValue);
                    setValues(values => ({ ...values, accessKeyId: newValue }));
                }
            }}
            secretAccessKey={{
                ...props.secretAccessKey,
                value: values.secretAccessKey,
                onChange: newValue => {
                    props.secretAccessKey.onChange(newValue);
                    setValues(values => ({ ...values, secretAccessKey: newValue }));
                }
            }}
            sessionToken={{
                ...props.sessionToken,
                value: values.sessionToken,
                onChange: newValue => {
                    props.sessionToken.onChange(newValue);
                    setValues(values => ({ ...values, sessionToken: newValue }));
                }
            }}
        />
    );
}

function createProps(params: {
    values: FormValues;
    errors: FormErrors;
    isEditionOfAnExistingConfig: boolean;
    isSubmittable: boolean;
}): Props {
    const { values, errors, isEditionOfAnExistingConfig, isSubmittable } = params;

    return {
        isEditionOfAnExistingConfig,
        profileName: {
            value: values.profileName,
            onChange: action("profileNameChange"),
            errorMessage: errors.profileName
        },
        endpointUrl: {
            value: values.endpointUrl,
            onChange: action("endpointUrlChange"),
            errorMessage: errors.endpointUrl
        },
        defaultRegion: {
            value: values.defaultRegion,
            onChange: action("defaultRegionChange"),
            errorMessage: errors.defaultRegion
        },
        urlStyle: {
            value: values.urlStyle,
            onChange: action("urlStyleChange")
        },
        isAnonymous: {
            value: values.isAnonymous,
            onChange: action("anonymousChange")
        },
        accessKeyId: {
            value: values.accessKeyId,
            onChange: action("accessKeyIdChange"),
            errorMessage: errors.accessKeyId
        },
        secretAccessKey: {
            value: values.secretAccessKey,
            onChange: action("secretAccessKeyChange"),
            errorMessage: errors.secretAccessKey
        },
        sessionToken: {
            value: values.sessionToken,
            onChange: action("sessionTokenChange"),
            errorMessage: errors.sessionToken
        },
        onSubmit: isSubmittable ? action("submit") : undefined,
        onCancel: action("cancel")
    };
}

export const EditProfile: Story = {
    args: baseArgs,
    render: args => <StatefulS3ProfileForm {...args} />
};

export const CreateProfile: Story = {
    args: createProps({
        values: {
            ...defaultValues,
            profileName: "Personal Sandbox",
            endpointUrl: "https://minio.lab.example.net",
            defaultRegion: undefined,
            urlStyle: "path",
            accessKeyId: undefined,
            secretAccessKey: undefined
        },
        errors: emptyErrors,
        isEditionOfAnExistingConfig: false,
        isSubmittable: true
    }),
    render: args => <StatefulS3ProfileForm {...args} />
};

export const AnonymousAccess: Story = {
    args: createProps({
        values: {
            ...defaultValues,
            profileName: "Public Open Data",
            endpointUrl: "https://object.data.gouv.fr",
            isAnonymous: true,
            accessKeyId: undefined,
            secretAccessKey: undefined,
            sessionToken: undefined
        },
        errors: emptyErrors,
        isEditionOfAnExistingConfig: true,
        isSubmittable: true
    }),
    render: args => <StatefulS3ProfileForm {...args} />
};

export const InvalidForm: Story = {
    args: createProps({
        values: {
            ...defaultValues,
            profileName: "S3 Default Profile",
            endpointUrl: "not a url",
            accessKeyId: ""
        },
        errors: {
            ...emptyErrors,
            profileName: "profile name already used",
            endpointUrl: "must be an url",
            accessKeyId: "is required"
        },
        isEditionOfAnExistingConfig: false,
        isSubmittable: false
    }),
    render: args => <StatefulS3ProfileForm {...args} />
};

export const ConstrainedHeight: Story = {
    args: baseArgs,
    decorators: [
        Story => (
            <div
                style={{
                    width: 430,
                    maxWidth: "100vw",
                    height: 420,
                    padding: 16,
                    boxSizing: "border-box"
                }}
            >
                <Story />
            </div>
        )
    ],
    render: args => <StatefulS3ProfileForm {...args} />
};
