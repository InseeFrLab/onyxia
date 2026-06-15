import { tss } from "tss";
import { routes } from "ui/routes";
import { useCoreState } from "core";
import { PUBLIC_URL } from "env";
import { assert } from "tsafe";
import { HomeLS3Hero } from "./HomeLS3Hero";
import { HomeLS3ServiceCard } from "./HomeLS3ServiceCard";
import { HomeLS3GitDialog, type Props_HomeLS3GitDialog } from "./HomeLS3GitDialog";
import { HomeLS3InfoCard } from "./HomeLS3InfoCard";
import Divider from "@mui/material/Divider";
import { useConst } from "powerhooks/useConst";
import { Evt, type UnpackEvt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import { getIconUrlByName } from "lazy-icons";

const serviceNames = ["RStudio", "Jupyter", "VSCode"] as const;

type ServiceName = (typeof serviceNames)[number];

export function HomeLS3() {
    const { classes } = useStyles();

    const { user } = useCoreState("userAuthentication", "main");
    assert(user !== undefined, "AUTHENTICATION_GLOBALLY_REQUIRED should be set to true");

    const evtGitDialogOpen = useConst(() =>
        Evt.create<UnpackEvt<Props_HomeLS3GitDialog["evtOpen"]>>()
    );

    const onServiceClick = async (serviceName: ServiceName) => {
        const dGitlabRepoUrl = new Deferred<string | undefined>();

        evtGitDialogOpen.post({
            serviceName,
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
                        case "Jupyter":
                            return "jupyter-python";
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
                                    case "Jupyter":
                                        return "Jupyter.png";
                                    case "RStudio":
                                        return "RStudio.jpg";
                                    case "VSCode":
                                        return "VSCode.webp";
                                }
                            })()}`}
                            onClick={() => onServiceClick(serviceName)}
                            serviceName={serviceName}
                        />
                    ))}
                </div>
                <Divider />
                <div className={classes.infoCardsWrapper}>
                    <HomeLS3InfoCard
                        title="Nouvel utilisateur ?"
                        body="Prend en main la platforme à travers un guide d'utilisation simple et rapide"
                        icon={getIconUrlByName("Book")}
                        link={
                            routes.document({
                                source: `${PUBLIC_URL}/custom-resources/docs/new-user.md`
                            }).link
                        }
                        buttonText="Démmarer le guide"
                    />
                    <HomeLS3InfoCard
                        title="Besoin d'aide ?"
                        body={
                            <>
                                Une question, un problème ou besoin d'assistance ?<br />
                                Contactez l'équipe en charge de la platforme.
                            </>
                        }
                        icon={getIconUrlByName("ChatBubble")}
                        link={{
                            href: "https://tchap.fr",
                            onClick: () => {}
                        }}
                        buttonText="Démmarer le guide"
                    />
                </div>
            </div>
            <HomeLS3GitDialog evtOpen={evtGitDialogOpen} />
        </>
    );
}

const useStyles = tss.withName({ HomeLS3 }).create(() => ({
    root: {
        height: "100%"
    },
    serviceCardsWrapper: {
        display: "flex"
    },
    serviceCardsWrapperItem: {
        flex: 1
    },
    infoCardsWrapper: {
        display: "flex"
    }
}));
