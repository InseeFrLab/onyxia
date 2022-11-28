import { getKcContext } from "keycloakify";

export const [kcContextLogin, kcContextRegister] = (
    ["login.ftl", "register.ftl"] as const
)
    .map(mockPageId =>
        getKcContext<{
            pageId: "register.ftl";
            /**
             * Defined when you use the keycloak-mail-whitelisting keycloak plugin
             * (https://github.com/micedre/keycloak-mail-whitelisting)
             */
            authorizedMailDomains?: string[];
        }>({
            mockPageId,
            "mockData": [
                {
                    "pageId": "login.ftl",
                    "social": {
                        "providers": [
                            {
                                "alias": "agentconnect",
                                "displayName": "Agent Connect",
                                "loginUrl": "#",
                                "providerId": "agentconnect"
                            }
                        ]
                    }
                },
                {
                    "pageId": "register.ftl",
                    /* spell-checker: disable */
                    "authorizedMailDomains": [
                        "insee.fr",
                        "gouv.fr",
                        "casd.eu",
                        "ensai.fr",
                        "ensae.fr",
                        "ars.sante.fr",
                        "*.gouv.fr",
                        "*.sante.gouv.fr",
                        "sante.gouv.fr",
                        "cnaf.fr",
                        "*.cnaf.fr",
                        "ac-lille.fr",
                        "ac-amiens.fr",
                        "ac-normandie.fr",
                        "ac-reims.fr",
                        "ac-nancy-metz.fr",
                        "ac-strasbourg.fr",
                        "ac-creteil.fr",
                        "ac-paris.fr",
                        "ac-versailles.fr",
                        "ac-rennes.fr",
                        "ac-nantes.fr",
                        "ac-orleans-tours.fr",
                        "ac-dijon.fr",
                        "ac-besancon.fr",
                        "ac-poitiers.fr",
                        "ac-limoges.fr",
                        "ac-clermont.fr",
                        "ac-lyon.fr",
                        "ac-grenoble.fr",
                        "ac-bordeaux.fr",
                        "ac-toulouse.fr",
                        "ac-montpellier.fr",
                        "ac-aix-marseille.fr",
                        "ac-nice.fr",
                        "ac-corse.fr",
                        "ac-martinique.fr",
                        "ac-guadeloupe.fr",
                        "ac-reunion.fr",
                        "ac-guyane.fr",
                        "ac-mayotte.fr",
                        "ac-wf.wf",
                        "monvr.pf",
                        "ac-noumea.nc",
                        "ac-spm.fr",
                        "*.ensai.fr"
                    ]
                    /* spell-checker: enable */
                }
            ]
        })
    )
    .map(({ kcContext }) => kcContext!);
