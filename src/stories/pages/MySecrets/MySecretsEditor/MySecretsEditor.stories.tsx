
import { MySecretsEditor } from "app/pages/MySecrets/MySecretsEditor";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "doProvideMockStore": true,
    "wrappedComponent": { MySecretsEditor }
});

export default meta;

export const Vue1 = getStory({
    "isBeingUpdated": false,
    "secretWithMetadata": {
        "metadata": null as any,
        "secret": {
            "DOMAIN": "example.com",
            "PROTOCOL": "https",
            "PORT": "8081",
            "BEFORE_DEFINED": '"$URL" hello world',
            "URL": '"PROTOCOL"://"$DOMAIN":"$PORT"',
            "notAValidEnv": "foo bar",
            "GITHUB_PAT": [...Array(30)].map(() => Math.random().toString(36)[2]).join(''),
            "A_MALFORMED_ENV": 'I have an uneven number of double quote " " " '
        }
    },
    ...logCallbacks([
        "onEdit"
    ])
});

