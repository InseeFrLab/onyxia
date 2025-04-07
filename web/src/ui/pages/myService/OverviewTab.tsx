import { declareComponentKeys } from "i18nifty";
import { Text } from "onyxia-ui/Text";
import { tss } from "tss";
import { useTranslation } from "ui/i18n";
import { RoundLogo } from "ui/shared/RoundLogo";

type HelmRelease = {
    friendlyName: string;
    revision: number;
    state:
        | "unknown"
        | "deployed"
        | "uninstalled"
        | "superseded"
        | "failed"
        | "uninstalling"
        | "pending-install"
        | "pending-upgrade"
        | "pending-rollback";
    updated: number;
    chartName: string;
    version: string;
};

type Pod = {
    name: string;
    status: string;
    ready: string;
    restartCount: number;
};

type Props = {
    helmRelease: HelmRelease;
    pods: Pod[];
    monitoringUrl: string;
    image: string;
};

export function OverviewTab(props: Props) {
    const { helmRelease, pods, image, monitoringUrl } = props;

    // const { t } = useTranslation({ OverviewTab });

    const { classes } = useStyles();
    const logoUrl =
        "https://minio.lab.sspcloud.fr/projet-onyxia/assets/servicesImg/jupyter.png";

    const helmFriendlyName = "Jupyter-python2";

    return (
        <>
            <div className={classes.card}>
                <div className={classes.aboveDivider}>
                    <RoundLogo url={logoUrl} size="large" />
                    <Text
                        className={classes.title}
                        typo="object heading"
                        componentProps={{ lang: "und" }}
                    >
                        Détail du service
                    </Text>
                </div>
                <div className={classes.belowDivider}>
                    <div className={classes.body}>
                        <Text typo="body 2">Image</Text>
                        <Text typo="label 2">{image}</Text>
                        <Text typo="body 2">Helm Release</Text>
                        <Text typo="label 2">{helmRelease.friendlyName}</Text>

                        <Text typo="body 2">Chart name</Text>
                        <Text typo="label 2">{helmRelease.chartName}</Text>

                        <Text typo="body 2">Chart Version</Text>
                        <Text typo="label 2">{helmRelease.version}</Text>

                        <Text typo="body 2">Nombre de révisions</Text>
                        <Text typo="label 2">{helmRelease.revision}</Text>

                        <Text typo="body 2">Créé le</Text>
                        <Text typo="label 2">
                            {new Date(helmRelease.updated).toLocaleString("fr-FR")}
                        </Text>
                        <Text typo="body 2">Dashboard Grafana</Text>
                        <Text
                            componentProps={{
                                href: monitoringUrl,
                                target: "_blank",
                                rel: "noopener noreferrer"
                            }}
                            typo="label 2"
                        >
                            📊 Voir les métriques
                        </Text>
                    </div>
                </div>
            </div>

            <div className={classes.card}>
                <div className={classes.aboveDivider}>
                    <Text className={classes.title} typo="object heading">
                        Ressources Kubernetes
                    </Text>
                </div>
                <div className={classes.belowDivider}>
                    <div className={classes.podGrid}>
                        {pods.map(pod => (
                            <div key={pod.name} className={classes.podCard}>
                                <Text typo="label 2">{pod.name}</Text>
                                <Text typo="body 2">
                                    {pod.status} {pod.ready}
                                </Text>
                                <Text typo="body 2">Redémarrages</Text>
                                <Text typo="label 2">{pod.restartCount}</Text>
                                <a href="">Voir les logs</a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

const useStyles = tss.withName({ OverviewTab }).create(({ theme }) => ({
    card: {
        borderRadius: 8,
        boxShadow: theme.shadows[1],
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        display: "flex",
        flexDirection: "column",
        alignSelf: "start", // ✅ Ajoute cette ligne
        margin: theme.spacing(4)
    },
    aboveDivider: {
        padding: theme.spacing({ topBottom: 3, rightLeft: 4 }),
        borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center"
    },
    title: {
        marginLeft: theme.spacing(3)
    },
    belowDivider: {
        padding: theme.spacing(4),
        paddingTop: theme.spacing(3),
        //flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
    },
    body: {
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        rowGap: theme.spacing(3),
        columnGap: theme.spacing(4),
        alignItems: "center"
    },
    podGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: theme.spacing(3),
        marginTop: theme.spacing(3)
    },
    podCard: {
        border: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        borderRadius: 6,
        padding: theme.spacing(3),
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    bodyTypo: {
        color: theme.colors.useCases.typography.textSecondary
    },
    buttonsWrapper: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: theme.spacing(4)
    },
    learnMoreButton: {
        marginRight: theme.spacing(2),
        visibility: "hidden"
    },
    highlightedChar: {
        color: theme.colors.useCases.typography.textFocus
    }
}));

const { i18n } = declareComponentKeys<
    | "details service"
    | "image"
    | "helm release"
    | "chart name"
    | "chart version"
    | "number of revisions"
    | "kubernetes resource"
    | "pods"
>()({ OverviewTab });
