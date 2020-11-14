
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "js/redux/hooks";
import { thunks } from "js/../libs/setup";
import { useEvt } from "evt/hooks";


export const MySecrets: React.FC = () => {

    const dispatch = useDispatch();

    const {
        userProfileInVault,
        secretExplorer,
        translateVaultRequests: { selectedVaultClientType }
    } = useSelector(state => state);

    useEvt(ctx => {

        const { evtVaultTranslation } = dispatch(thunks.translateVaultRequests.getSelectedTranslator());

        evtVaultTranslation.attach(ctx, data => {
            console.log("$ " + data.value);
        });

    }, [dispatch, selectedVaultClientType]);

    useEffect(() => {

        (async () => {

            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log("Go, update kaggleApiToken");

            dispatch(
                thunks.userProfileInVault.changeValue({
                    "key": "kaggleApiToken",
                    "value": `${Date.now()}`
                })
            );

        })();


    }, [dispatch]);

    return (
        <>
            <h1>Here are the secrets currently stored at {secretExplorer.currentPath}</h1>
            {JSON.stringify(userProfileInVault, null, 2).split('\n').map((str,i) => <p key={i}>{str}</p>)}
        </>
    );

};