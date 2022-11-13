import { useEffect } from "react";
import { Typography, Paper, Tooltip, Fab } from "@mui/material";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import "../app.scss";
import "./myBuckets.scss";
import { useCoreState, selectors } from "core";
import { asyncThunks as myFilesActions } from "js/redux/myFiles";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { useDispatch } from "js/hooks";
import { createGroup } from "type-route";
import { routes } from "ui/routes";
import type { DeploymentRegion } from "core/ports/OnyxiaApiClient";

MyBuckets.routeGroup = createGroup([routes.myBuckets]);

MyBuckets.getDoRequireUserLoggedIn = true as const;

export function MyBuckets() {
    const dispatch = useDispatch();

    const buckets = useCoreState(state => state.myFiles.userBuckets);

    const { selectedDeploymentRegion } = useCoreState(
        selectors.deploymentRegion.selectedDeploymentRegion,
    );

    useEffect(() => {
        if (!buckets) {
            dispatch(myFilesActions.loadUserBuckets());
        }
    }, [buckets]);

    return (
        <LegacyThemeProvider>
            <div className="en-tete">
                <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
                    Vos fichiers sur Minio
                </Typography>
            </div>
            <FilDAriane fil={fil.mesFichiers} />

            <div className="contenu mes-fichiers">
                <Paper className="paper" elevation={1}>
                    <Typography
                        variant="h3"
                        align="left"
                        color="textPrimary"
                        gutterBottom
                    >
                        La liste de vos dépots
                    </Typography>
                    <div id="bucket-list">
                        {buckets?.map(({ id, description }: any, i: any) => {
                            return (
                                <Bucket
                                    key={i}
                                    description={description}
                                    id={id}
                                    region={selectedDeploymentRegion}
                                />
                            );
                        })}
                    </div>
                </Paper>
            </div>
        </LegacyThemeProvider>
    );
}

const Bucket = ({
    id,
    description,
    region,
}: {
    id: string;
    description: string;
    region: DeploymentRegion;
}) => {
    const monitoringUrl = region.s3?.monitoringUrlPattern?.replace("$BUCKET_ID", id);

    return (
        <>
            <Paper className="onyxia-toolbar actions" elevation={5}>
                <a {...routes.myFilesLegacy({ "bucketName": id }).link}>
                    <h4>{id}</h4>
                    <h5>{description}</h5>
                </a>
                {monitoringUrl && (
                    <Tooltip title="Monitoring" className="action">
                        <Fab
                            color="secondary"
                            aria-label="monitor"
                            classes={{ root: "bouton" }}
                            onClick={() => window.open(monitoringUrl)}
                        >
                            <EqualizerIcon>equalizer</EqualizerIcon>
                        </Fab>
                    </Tooltip>
                )}
            </Paper>
        </>
    );
};
