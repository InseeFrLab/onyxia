import { useEffect } from "react";
import { Typography, Paper, Tooltip, Fab, Icon } from "@mui/material";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import "./myBuckets.scss";
import { useSelector, selectors } from "app/libApi";
import { actions as myFilesActions } from "js/redux/myFiles";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { useDispatch } from "js/hooks";
import { createGroup } from "type-route";
import { routes } from "app/routes/router";
import type { DeploymentRegion } from "lib/ports/OnyxiaApiClient";

MyBuckets.routeGroup = createGroup([routes.myBuckets]);

MyBuckets.requireUserLoggedIn = true as const;

export function MyBuckets() {
    const dispatch = useDispatch();

    const buckets = useSelector(state => state.myFiles.userBuckets);

    const { selectedDeploymentRegion } = useSelector(
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
    const monitoringUrl = region.s3MonitoringUrlPattern?.replace("$BUCKET_ID", id);

    return (
        <>
            <Paper className="onyxia-toolbar actions" elevation={5}>
                <a {...routes.myFiles({ "bucketName": id }).link}>
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
                            <Icon>equalizer</Icon>
                        </Fab>
                    </Tooltip>
                )}
            </Paper>
        </>
    );
};
