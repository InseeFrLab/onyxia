import { useState, useEffect, useCallback } from "react";
import { MySecretsEditor } from "ui/components/pages/MySecrets/MySecretsEditor";
import type { Props } from "ui/components/pages/MySecrets/MySecretsEditor";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { sectionName } from "./sectionName";
import { symToStr } from "tsafe/symToStr";

const artificialDelay = 3000;

const preloadedSecretWitMetadata: Props["secretWithMetadata"] = {
    "metadata": {
        "created_time": "2021-01-05T05:18:37.880Z",
        "deletion_time": "",
        "destroyed": false,
        "version": 1,
    },
    "secret": {
        "DOMAIN": "example.com",
        "PROTOCOL": "https",
        "PORT": "8081",
        "BEFORE_DEFINED": '"$URL"hello world',
        "URL": "$PROTOCOL://$DOMAIN:$PORT",
        "API_URL": "$URL/api",
        "FOO": '__"$URL"__',
        "notAValidEnv": "foo bar",
        "GITHUB_PAT": [...Array(255)].map(() => Math.random().toString(36)[2]).join(""),
        "A_MALFORMED_ENV": 'I have an uneven number of double quote " " " ',
    },
};

function Component(props: Omit<Props, "onEdit" | "secretWithMetadata">) {
    const [secret, setSecret] = useState(preloadedSecretWitMetadata.secret);

    const [metadata, setMetadata] = useState(preloadedSecretWitMetadata.metadata);

    const [isBeingUpdated, setIsBeingUpdated] = useState(props.isBeingUpdated);

    useEffect(() => {
        setIsBeingUpdated(props.isBeingUpdated);
    }, [props.isBeingUpdated]);

    const onEdit = useCallback(
        async (params: Parameters<Props["onEdit"]>[0]) => {
            const { key } = params;

            //By doing that we preserve the ordering of the
            //properties in the record.
            const renameKey = (params: { newKey: string }) => {
                const { newKey } = params;

                const secretClone = { ...secret };

                Object.keys(secretClone).forEach(key => {
                    delete secret[key];
                });

                Object.keys(secretClone).forEach(
                    key_i =>
                        (secret[key_i === key ? newKey : key_i] = secretClone[key_i]),
                );
            };

            switch (params.action) {
                case "addOrOverwriteKeyValue":
                    {
                        const { value } = params;
                        secret[key] = value;
                    }
                    break;
                case "removeKeyValue":
                    delete secret[key];
                    break;
                case "renameKeyAndUpdateValue":
                    {
                        const { newKey, newValue } = params;
                        renameKey({ newKey });
                        secret[newKey] = newValue;
                    }
                    break;
                case "renameKey":
                    {
                        const { newKey } = params;
                        renameKey({ newKey });
                    }
                    break;
            }

            setIsBeingUpdated(true);

            setSecret({ ...secret });

            await new Promise(resolve => setTimeout(resolve, artificialDelay));

            metadata.created_time = new Date().toISOString();
            metadata.version++;

            setMetadata({ ...metadata });

            setIsBeingUpdated(false);
        },
        [secret, metadata],
    );

    const {
        onCopyPath,
        onDoDisplayUseInServiceDialogValueChange,
        doDisplayUseInServiceDialog,
    } = props;

    return (
        <div style={{ "width": 1600 }}>
            <MySecretsEditor
                {...{
                    isBeingUpdated,
                    onEdit,
                    onCopyPath,
                    doDisplayUseInServiceDialog,
                    onDoDisplayUseInServiceDialogValueChange,
                }}
                secretWithMetadata={{
                    metadata,
                    secret,
                }}
            />
        </div>
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ MySecretsEditor })]: Component },
});

export default meta;

export const View1 = getStory({
    "doDisplayUseInServiceDialog": true,
    "isBeingUpdated": false,
    ...logCallbacks(["onCopyPath", "onDoDisplayUseInServiceDialogValueChange"]),
});
