
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "js/redux/hooks";
import { thunks } from "js/../libs/setup";


export const MySecrets: React.FC = () => {

    const dispatch = useDispatch();

    const viewAndEditUserProfile = useSelector(state => state.viewAndEditUserProfile);
    const secretExplorer = useSelector(state => state.secretExplorer);

    useEffect(() => {

        (async () => {

            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log("Go, update kaggleApiToken");

            dispatch(
                thunks.viewAndEditUserProfile.changeValue({
                    "key": "kaggleApiToken",
                    "value": `${Date.now()}`
                })
            );

        })();


    }, [dispatch]);

    return (
        <>
            <h1>Here are the secrets currently stored at {secretExplorer.currentPath}</h1>
            {JSON.stringify(viewAndEditUserProfile, null, 2).split('\n').map(str => <p key={str}>{str}</p>)}
        </>
    );

};