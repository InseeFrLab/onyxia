import { useMemo, useCallback } from "react";
import Typography from "@material-ui/core/Typography";
import dayjs from "dayjs";
import GitInfo from "react-git-info/macro";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import SelectRegion from "./SelectRegion";
import type { Region } from "js/model/Region";
import CopyableField from "../commons/copyable-field";
import { useDispatch, useSelector, useAppConstants } from "app/interfaceWithLib/hooks";
import { thunks } from "lib/setup";

export function About() {
    const dispatch = useDispatch();

    const { regions, build } = useAppConstants({
        "assertIsUserLoggedInIs": true,
    });
    const deploymentRegionId = useSelector(
        state => state.userConfigs.deploymentRegionId.value,
    );

    const gitInfo = GitInfo();

    const versionInterface = gitInfo.tags?.[0] ?? gitInfo.branch;

    const versionInterfaceDate = gitInfo.commit.date;

    const serverVersion = useMemo(
        () => [build.version, " (", dayjs(build.timestamp * 1000).format(), ")"].join(""),

        [],
    );

    const onRegionSelected = useCallback(
        (region: Region) =>
            dispatch(
                thunks.userConfigs.changeValue({
                    "key": "deploymentRegionId",
                    "value": region.id,
                }),
            ),
        [dispatch],
    );

    return (
        <>
            <div className="en-tete">
                <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
                    A propos d'Onyxia
                </Typography>
            </div>
            <FilDAriane fil={fil.about} />
            <div className="contenu accueil">
                <CopyableField
                    label="Interface version"
                    value={`${versionInterface} (${versionInterfaceDate})`}
                    copy
                />
                <CopyableField label="Server version" value={serverVersion} copy />

                <SelectRegion
                    regions={regions}
                    selectedRegion={deploymentRegionId}
                    onRegionSelected={onRegionSelected}
                />
            </div>
        </>
    );
}
