import { describe, it, expect } from "vitest";
import {
    getServiceOpenUrlAndMaybeAddPortToPostInstallInstructionsUrls,
    type HelmReleaseLike
} from "./getServiceOpenUrlAndMaybeAddPortToPostInstallInstructionsUrls";

const testCases: {
    helmRelease: HelmReleaseLike;
    kubernetesClusterIngressPort: number | undefined;
    preferredOpenUrlHostname: string | undefined;
    expected: {
        openUrl: string | undefined;
        postInstallInstructions_patched: string | undefined;
    };
}[] = [
    {
        helmRelease: {
            urls: ["https://example.com/"],
            postInstallInstructions: undefined
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/",
            postInstallInstructions_patched: undefined
        }
    },
    {
        helmRelease: {
            urls: ["https://b.com", "https://a.com"],
            postInstallInstructions: undefined
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: { openUrl: "https://a.com", postInstallInstructions_patched: undefined }
    },
    {
        helmRelease: {
            urls: [
                "https://subdomain.a.com/",
                "https://subdomain.b.com/",
                "https://subdomain.a-b.com/"
            ],
            postInstallInstructions: ""
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: "b.com",
        expected: {
            openUrl: "https://subdomain.b.com/",
            postInstallInstructions_patched: ""
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions: "Check this link: https://unrelated.com/page"
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com", // Should ignore unrelated URLs
            postInstallInstructions_patched: "Check this link: https://unrelated.com/page"
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com/"],
            postInstallInstructions:
                "Click this link: https://example.com/foo?token=abc and follow the steps."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/foo?token=abc",
            postInstallInstructions_patched:
                "Click this link: https://example.com/foo?token=abc and follow the steps."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions: "You can try https://example.com/foo to get started."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/foo",
            postInstallInstructions_patched:
                "You can try https://example.com/foo to get started."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com", "https://test.com"],
            postInstallInstructions:
                "Visit https://example.com/foo for setup or https://test.com/bar for documentation."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/foo",
            postInstallInstructions_patched:
                "Visit https://example.com/foo for setup or https://test.com/bar for documentation."
        }
    },
    {
        helmRelease: {
            urls: ["https://sub.example.com"],
            postInstallInstructions: "Check https://example.com/page and let us know."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://sub.example.com", // Should not match and return the default URL
            postInstallInstructions_patched:
                "Check https://example.com/page and let us know."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "Invalid URL: https://example.com_missing_path should not be matched."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com", // Should not match and return the default URL
            postInstallInstructions_patched:
                "Invalid URL: https://example.com_missing_path should not be matched."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "You can try https://example.com#anchor to see the details."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com#anchor",
            postInstallInstructions_patched:
                "You can try https://example.com#anchor to see the details."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "Visit https://example.com/foo/bar/baz?param=123&other=abc before continuing."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/foo/bar/baz?param=123&other=abc",
            postInstallInstructions_patched:
                "Visit https://example.com/foo/bar/baz?param=123&other=abc before continuing."
        }
    },
    {
        helmRelease: {
            urls: ["https://example.com/setup"],
            postInstallInstructions:
                "Go to https://example.com/setup and enter your credentials."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://example.com/setup",
            postInstallInstructions_patched:
                "Go to https://example.com/setup and enter your credentials."
        }
    },
    {
        helmRelease: {
            urls: ["https://docs.example.com"],
            postInstallInstructions:
                "Find more details here: https://docs.example.com or contact support."
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://docs.example.com",
            postInstallInstructions_patched:
                "Find more details here: https://docs.example.com or contact support."
        }
    },
    {
        helmRelease: {
            urls: [
                "https://user-ddecrulle-507582.user.lab.sspcloud.fr/",
                "https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr/"
            ],
            postInstallInstructions:
                "\n- Votre nom d'utilisateur est **elastic**\n- Votre mot de passe est **mot-de-pase**\n- Vous pouvez vous connecter à elastic avec votre navigateur à ce [lien](https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr)\n- Vous pouvez vous connectez à elastic depuis l'intérieur du datalab à cette URL : **http://elastic-507582-elasticsearch:9200**\n- Vous pouvez vous connecter à kibana avec votre navigateur à ce [lien](https://user-ddecrulle-507582.user.lab.sspcloud.fr)\n- Un seul cluster de elastic peut être démarré dans un projet\n\n**NOTES sur la suppression :**\n\n- **Vous pouvez supprimer ce chart en toute sécurité et en recréer un plus tard**\n- Les volumes de données ne seront pas supprimés\n- Si vous démarrez un nouveau elastic, il réutilisera ces volumes en silence.\n- Si vous souhaitez supprimer définitivement ces volumes : `kubectl delete pvc data-elastic-elasticsearch-master-0 data-elastic-elasticsearch-master-1 data-elastic-elasticsearch-data-0 data-elastic-elasticsearch-data-1`\n"
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr",
            postInstallInstructions_patched:
                "\n- Votre nom d'utilisateur est **elastic**\n- Votre mot de passe est **mot-de-pase**\n- Vous pouvez vous connecter à elastic avec votre navigateur à ce [lien](https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr)\n- Vous pouvez vous connectez à elastic depuis l'intérieur du datalab à cette URL : **http://elastic-507582-elasticsearch:9200**\n- Vous pouvez vous connecter à kibana avec votre navigateur à ce [lien](https://user-ddecrulle-507582.user.lab.sspcloud.fr)\n- Un seul cluster de elastic peut être démarré dans un projet\n\n**NOTES sur la suppression :**\n\n- **Vous pouvez supprimer ce chart en toute sécurité et en recréer un plus tard**\n- Les volumes de données ne seront pas supprimés\n- Si vous démarrez un nouveau elastic, il réutilisera ces volumes en silence.\n- Si vous souhaitez supprimer définitivement ces volumes : `kubectl delete pvc data-elastic-elasticsearch-master-0 data-elastic-elasticsearch-master-1 data-elastic-elasticsearch-data-0 data-elastic-elasticsearch-data-1`\n"
        }
    },
    {
        helmRelease: {
            urls: ["https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/"],
            postInstallInstructions: `
- You can connect to this ubuntu within your browser at this [link](https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/vnc.html)
- You will need this service password to access the service: **mot-de-passe**
  *It usually never changes except if you or a member of your project requested it to*.

            `
        },
        kubernetesClusterIngressPort: undefined,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/vnc.html",
            postInstallInstructions_patched: `
- You can connect to this ubuntu within your browser at this [link](https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/vnc.html)
- You will need this service password to access the service: **mot-de-passe**
  *It usually never changes except if you or a member of your project requested it to*.

            `
        }
    },
    {
        helmRelease: {
            urls: ["https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/"],
            postInstallInstructions: `
- You can connect to this ubuntu within your browser at this [link](https://user-ddecrulle-100154-0.user.lab.sspcloud.fr/vnc.html)
- You will need this service password to access the service: **mot-de-passe**
  *It usually never changes except if you or a member of your project requested it to*.

            `
        },
        kubernetesClusterIngressPort: 8080,
        preferredOpenUrlHostname: undefined,
        expected: {
            openUrl: "https://user-ddecrulle-100154-0.user.lab.sspcloud.fr:8080/vnc.html",
            postInstallInstructions_patched: `
- You can connect to this ubuntu within your browser at this [link](https://user-ddecrulle-100154-0.user.lab.sspcloud.fr:8080/vnc.html)
- You will need this service password to access the service: **mot-de-passe**
  *It usually never changes except if you or a member of your project requested it to*.

            `
        }
    }
];

describe("getServiceOpenUrl", () => {
    testCases.forEach(
        (
            {
                helmRelease,
                kubernetesClusterIngressPort,
                preferredOpenUrlHostname,
                expected
            },
            index
        ) => {
            it(`should return the correct URL for test case #${index + 1}`, () => {
                const result =
                    getServiceOpenUrlAndMaybeAddPortToPostInstallInstructionsUrls({
                        helmRelease,
                        kubernetesClusterIngressPort,
                        preferredOpenUrlHostname
                    });
                expect(result).toStrictEqual(expected);
            });
        }
    );
});
