import { tss } from "tss";
import { routes } from "ui/routes";
import { useCoreState } from "core";
import { PUBLIC_URL } from "env";
import { assert } from "tsafe";
import { HomeLS3Hero } from "./HomeLS3Hero";
import { HomeLS3ServiceCard } from "./HomeLS3ServiceCard";
import {
    HomeLS3LaunchDialog,
    type Props_HomeLS3LaunchDialog
} from "./HomeLS3LaunchDialog";
import { HomeLS3InfoCard } from "./HomeLS3InfoCard";
import Divider from "@mui/material/Divider";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { getIconUrlByName } from "lazy-icons";

const serviceNames = ["RStudio", "VSCode"] as const;

type ServiceName = (typeof serviceNames)[number];

export function HomeLS3() {
    const { classes, css, theme } = useStyles();

    const { user } = useCoreState("userAuthentication", "main");
    assert(user !== undefined, "AUTHENTICATION_GLOBALLY_REQUIRED should be set to true");

    const evtGitDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<Props_HomeLS3LaunchDialog["evtOpen"]>>()
    );

    const onServiceClick = async (serviceName: ServiceName) => {
        const dGitlabRepoUrl = new Deferred<string | undefined>();

        evtGitDialogOpen.post({
            serviceName,
            serviceIconUrl: `${PUBLIC_URL}/custom-resources/assets/${(() => {
                switch (serviceName) {
                    case "RStudio":
                        return "rstudio_logo.webp";
                    case "VSCode":
                        return "vscode_logo.png";
                }
            })()}`,
            onUserResponse: params => {
                switch (params.response) {
                    case "cancel":
                        // Do nothing, pending forever.
                        break;
                    case "launch with git repo":
                        dGitlabRepoUrl.resolve(params.gitlabRepoUrl);
                        break;
                    case "launch without git repo":
                        dGitlabRepoUrl.resolve(undefined);
                        break;
                }
            }
        });

        const gitlabRepoUrl = await dGitlabRepoUrl.pr;

        routes
            .launcher({
                catalogId: "ide",
                chartName: (() => {
                    switch (serviceName) {
                        case "RStudio":
                            return "rstudio-r-python-julia";
                        case "VSCode":
                            return "vscode-r-python-julia";
                    }
                })(),
                helmValuesPatch:
                    gitlabRepoUrl === undefined
                        ? undefined
                        : [
                              {
                                  path: ["git", "repository"],
                                  value: gitlabRepoUrl
                              }
                          ],
                autoLaunch: true
            })
            .push();
    };

    return (
        <>
            <div className={classes.root}>
                <HomeLS3Hero
                    userDisplayName={user.firstName ?? user.familyName ?? user.username}
                />
                <Divider />
                <div className={classes.serviceCardsWrapper}>
                    {serviceNames.map(serviceName => (
                        <HomeLS3ServiceCard
                            className={classes.serviceCardsWrapperItem}
                            key={serviceName}
                            coverImageUrl={`${PUBLIC_URL}/custom-resources/assets/${(() => {
                                switch (serviceName) {
                                    case "RStudio":
                                        return "RStudio.jpg";
                                    case "VSCode":
                                        return "VSCode.webp";
                                }
                            })()}`}
                            onClick={() => onServiceClick(serviceName)}
                            serviceName={serviceName}
                            title={(() => {
                                switch (serviceName) {
                                    case "RStudio":
                                        return "Pour coder en R";
                                    case "VSCode":
                                        return "Pour coder en Python";
                                }
                            })()}
                        />
                    ))}
                </div>
                <Divider />
                <div className={classes.infoCardsWrapper}>
                    <HomeLS3InfoCard
                        className={css({
                            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
                        })}
                        title="Nouvel utilisateur ?"
                        body={
                            <>
                                Prends en main la plateforme à travers
                                <br />
                                un guide d'utilisation simple et rapide.
                            </>
                        }
                        icon={getIconUrlByName("Book")}
                        link={
                            routes.document({
                                source: `${PUBLIC_URL}/custom-resources/docs/new-user.md`
                            }).link
                        }
                        buttonText="Démarrer le guide"
                    />
                    <HomeLS3InfoCard
                        title="Besoin d'aide ?"
                        body={
                            <>
                                Une question, un problème ou besoin d'assistance ?<br />
                                Contactez l'équipe en charge de la plateforme.
                            </>
                        }
                        icon={getIconUrlByName("ChatBubble")}
                        link={{
                            href: "https://tchap.fr",
                            onClick: () => {}
                        }}
                        buttonText="Contacter le support"
                    />
                </div>
            </div>
            <HomeLS3LaunchDialog evtOpen={evtGitDialogOpen} />
        </>
    );
}

const useStyles = tss.withName({ HomeLS3 }).create(({ theme }) => ({
    root: {
        height: "100%"
    },
    serviceCardsWrapper: {
        display: "flex",
        gap: theme.spacing(3),
        ...theme.spacing.topBottom("margin", 3)
    },
    serviceCardsWrapperItem: {
        width: 450
    },
    infoCardsWrapper: {
        display: "flex",
        gap: theme.spacing(3),
        ...theme.spacing.topBottom("margin", 3)
    }
}));
