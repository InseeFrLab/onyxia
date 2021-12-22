import Typography from "@mui/material/Typography";
import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import { Paper } from "@mui/material";
import CopyableField from "../commons/copyable-field";
import ExportCredentialsField from "../mon-compte/export-credentials-component";
import D from "js/i18n";
import exportKub from "./exportCredentialsKub";
import { getValidatedEnv } from "js/validatedEnv";
import { useThunks } from "ui/coreApi";

const env = getValidatedEnv();

const EnTete = () => (
    <div className="en-tete">
        <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
            {D.cluster}
        </Typography>
    </div>
);

const Cluster = () => {
    const oidcAccessToken = "";

    const { userAuthenticationThunks } = useThunks();

    const { username: preferred_username } = userAuthenticationThunks.getUser();

    return (
        <>
            <EnTete />
            <FilDAriane fil={fil.cluster} />
            <div className="contenu accueil">
                <Paper className="paragraphe" elevation={1}>
                    <Typography variant="h3" align="left">
                        Kubernetes
                    </Typography>
                    <Typography variant="body1" align="left">
                        {D.k8sLoginExplanation}
                    </Typography>
                    {env.KUBERNETES !== undefined && (
                        <>
                            <CopyableField
                                copy
                                label="Cluster Name"
                                value={env.KUBERNETES.KUB_SERVER_NAME}
                            />
                            <CopyableField
                                copy
                                label="Api-server url"
                                value={env.KUBERNETES.KUB_SERVER_URL}
                            />
                        </>
                    )}
                    <CopyableField copy label="Token" value={oidcAccessToken} />
                    <ExportCredentialsField
                        credentials={{
                            "idep": preferred_username,
                            oidcAccessToken,
                        }}
                        exportTypes={exportKub}
                        text={D.exportKub}
                    />
                </Paper>
            </div>
        </>
    );
};

export default Cluster;
