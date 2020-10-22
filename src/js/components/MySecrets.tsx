
import React from "react";
import { vaultApi } from "js/vault";
import { locallyStoredOidcAccessToken } from "js/utils/locallyStoredOidcAccessToken";
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";

const path = `/${locallyStoredOidcAccessToken.getParsed().preferred_username}/.onyxia/profile`;

export const MySecrets: React.FC = () => {

    const { result: profile }= useAsync(
        () => vaultApi.getSecret({ path }),
        []
    );

    return profile === undefined ? 
        <Loader em={30} /> :
        <>
            <h1>Here are the secrets currently stored at {path}</h1>
            {JSON.stringify(profile, null, 2).split('\n').map(str => <p key={str}>{str}</p>)}
        </>;

};