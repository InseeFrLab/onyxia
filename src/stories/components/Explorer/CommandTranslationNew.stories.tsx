
import { useState, useEffect, useReducer } from "react";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { CmdTranslation as CmdTranslationNew } from "app/components/Explorer/CmdTranslationNew";
import type { Props } from "app/components/Explorer/CmdTranslationNew";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { symToStr } from "app/utils/symToStr";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

type StoryProps = {
    width: number;
    maxHeight: number;
    /** Toggle to fire a translation event */ 
    tick: boolean;
};

const useStyles = makeStyles(
    () => createStyles<"root", StoryProps>({
        "root": ({ width }) => ({
            "border": "1px solid black",
            width
        })
    })
);

const translations: UnpackEvt<Props["evtTranslation"][]> = [
    {
        "cmdId": 0,
        "type": "cmd",
        "translation": "vault write auth/jwt/login role=onyxia-user jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpvaG4uZG9lQGluc2VlLmZyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZG9laiIsImdpdGxhYl9ncm91cCI6bnVsbCwibmFtZSI6IiJ9.eAs8RQ_lfvjh_qYZtRYO9qp7VI6TLwWrRLd3Xr3Yt8g"
    },
    {
        "cmdId": 0,
        "type": "result",
        "translation": `Success! You are now authenticated! Notes from the Onyxia team: 
        -You do not have to run this command nor define the VAULT_ADDR environnement variable to use vault in Jupyter or RStudio's terminal, you're pre-logged in. 
        -The jwt is your OIDC access token, you can find it in the 'my account' page. 
        -You may notice a VAULT_TOKEN environnement variable defined in your containers however your don't need to define this env on your machine if you use your OIDC access token to login.
        
        Relevant doc: https://www.vaultproject.io/docs/auth/jwt#jwt-authentication https://learn.hashicorp.com/tutorials/vault/getting-started-dev-server?in=vault/getting-started
        `
    },
    {
        "cmdId": 1,
        "type": "cmd",
        "translation": "vault kv list onyxia-kv/doej"
    },
    {
        "cmdId": 1,
        "type": "result",
        "translation": `
        Keys
        ----
        .onyxia/
        dossier_test/
        secret_sans_nom
        untitled_secret
        `
    },
    {
        "cmdId": 2,
        "type": "cmd",
        "translation": "vault kv get onyxia-kv/doej/.onyxia/userServicePassword"
    },
    {
        "cmdId": 2,
        "type": "result",
        "translation": `
        ==== Data ====
        Key    Value
        ---    -----
        value  01xlcu1hg4wxzib08xe4
        `
    },
    {
        "cmdId": 3,
        "type": "cmd",
        "translation": "cmd 3"
    },
    {
        "cmdId": 4,
        "type": "cmd",
        "translation": "cmd 4"
    },
    {
        "cmdId": 3,
        "type": "result",
        "translation": "result of cmd 3"
    },
    {
        "cmdId": 4,
        "type": "result",
        "translation": "result of cmd 4"
    },
    {
        "cmdId": 5,
        "type": "cmd",
        "translation": "cmd 5"
    },
    {
        "cmdId": 5,
        "type": "result",
        "translation": "result of cmd 5"
    },
    {
        "cmdId": 6,
        "type": "cmd",
        "translation": "cmd 6"
    },
    {
        "cmdId": 6,
        "type": "result",
        "translation": "result of cmd 6"
    },
];

function Component(props: Omit<Props, "className" | "evtTranslation"> & StoryProps) {

    const { tick, maxHeight } = props;

    const [index, incrementIndex] = useReducer(
        (index: number) => 
            (index === translations.length - 1) ?
            index :
            index + 1,
        0
    );

    useEffect(
        () => { incrementIndex(); },
        [tick]
    );

    const classes = useStyles(props);

    const [evtTranslation] = useState(() => Evt.create<typeof translations[number]>());

    useEffect(
        () => {
            evtTranslation.postAsyncOnceHandled(translations[index]);
        },
        [evtTranslation, index]
    );

    return (
        <CmdTranslationNew
            className={classes.root}
            evtTranslation={evtTranslation}
            maxHeight={maxHeight}
        />
    );

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ CmdTranslationNew })]: Component }
});


export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920,
                "step": 10
            }
        },
        "maxHeight": {
            "control": {
                "type": "range",
                "min": 100,
                "max": 1080,
                "step": 10
            }
        },
        "tick": {
            "control": {
                "type": "boolean",
            }
        }

    }
};

export const Vue1 = getStory({
    "width": 800,
    "maxHeight": 350,
    "tick": true
});





