
import React from "react";
import { useDispatch, useSelector } from "js/redux/hooks";
import { thunks } from "lib/setup";
import { useEvt } from "evt/hooks";


export const MySecrets: React.FC = () => {

    const dispatch = useDispatch();

    const {
        userProfileInVault,
        translateVaultRequests: { selectedVaultClientType }
    } = useSelector(state => state);

    useEvt(ctx => {

        const { evtVaultTranslation } = dispatch(thunks.translateVaultRequests.getSelectedTranslator());

        evtVaultTranslation.attach(ctx, data => {
            console.log("$ " + data.value);
        });

    }, [dispatch, selectedVaultClientType]);

    return (
        <>
            {JSON.stringify(userProfileInVault, null, 2).split('\n').map((str,i) => <p key={i}>{str}</p>)}
        </>
    );

};