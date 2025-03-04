import { describe, it, expect } from "vitest";
import { getServiceOpenUrl, type HelmReleaseLike } from "./getServiceOpenUrl";

const testCases: {
    helmRelease: HelmReleaseLike;
    expected: string | null;
}[] = [
    {
        helmRelease: {
            urls: ["https://example.com/"],
            postInstallInstructions: undefined
        },
        expected: "https://example.com/"
    },
    {
        helmRelease: {
            urls: ["https://b.com", "https://a.com"],
            postInstallInstructions: undefined
        },
        expected: "https://a.com"
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions: "Check this link: https://unrelated.com/page"
        },
        expected: "https://example.com" // Should ignore unrelated URLs
    },
    {
        helmRelease: {
            urls: ["https://example.com/"],
            postInstallInstructions:
                "Click this link: https://example.com/foo?token=abc and follow the steps."
        },

        expected: "https://example.com/foo?token=abc"
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions: "You can try https://example.com/foo to get started."
        },
        expected: "https://example.com/foo"
    },
    {
        helmRelease: {
            urls: ["https://example.com", "https://test.com"],
            postInstallInstructions:
                "Visit https://example.com/foo for setup or https://test.com/bar for documentation."
        },
        expected: "https://example.com/foo"
    },
    {
        helmRelease: {
            urls: ["https://sub.example.com"],
            postInstallInstructions: "Check https://example.com/page and let us know."
        },
        expected: "https://sub.example.com" // Should not match and return the default URL
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "Invalid URL: https://example.com_missing_path should not be matched."
        },
        expected: "https://example.com" // Should not match and return the default URL
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "You can try https://example.com#anchor to see the details."
        },
        expected: "https://example.com#anchor"
    },
    {
        helmRelease: {
            urls: ["https://example.com"],
            postInstallInstructions:
                "Visit https://example.com/foo/bar/baz?param=123&other=abc before continuing."
        },
        expected: "https://example.com/foo/bar/baz?param=123&other=abc"
    },
    {
        helmRelease: {
            urls: ["https://example.com/setup"],
            postInstallInstructions:
                "Go to https://example.com/setup and enter your credentials."
        },
        expected: "https://example.com/setup"
    },
    {
        helmRelease: {
            urls: ["https://docs.example.com"],
            postInstallInstructions:
                "Find more details here: https://docs.example.com or contact support."
        },
        expected: "https://docs.example.com"
    },
    {
        helmRelease: {
            urls: [
                "https://user-ddecrulle-507582.user.lab.sspcloud.fr/",
                "https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr/"
            ],
            postInstallInstructions:
                "\n- Votre nom d'utilisateur est **elastic**\n- Votre mot de passe est **futwkep8m5gyxeth6b0f**\n- Vous pouvez vous connecter à elastic avec votre navigateur à ce [lien](https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr)\n- Vous pouvez vous connectez à elastic depuis l'intérieur du datalab à cette URL : **http://elastic-507582-elasticsearch:9200**\n- Vous pouvez vous connecter à kibana avec votre navigateur à ce [lien](https://user-ddecrulle-507582.user.lab.sspcloud.fr)\n- Un seul cluster de elastic peut être démarré dans un projet\n\n**NOTES sur la suppression :**\n\n- **Vous pouvez supprimer ce chart en toute sécurité et en recréer un plus tard**\n- Les volumes de données ne seront pas supprimés\n- Si vous démarrez un nouveau elastic, il réutilisera ces volumes en silence.\n- Si vous souhaitez supprimer définitivement ces volumes : `kubectl delete pvc data-elastic-elasticsearch-master-0 data-elastic-elasticsearch-master-1 data-elastic-elasticsearch-data-0 data-elastic-elasticsearch-data-1`\n"
        },
        expected: "https://user-ddecrulle-elasticsearch-507582.user.lab.sspcloud.fr"
    }
];

describe("getServiceOpenUrl", () => {
    testCases.forEach(({ helmRelease, expected }, index) => {
        it(`should return the correct URL for test case #${index + 1}`, () => {
            const result = getServiceOpenUrl({ helmRelease });
            console.log(helmRelease, expected, result);
            expect(result).toBe(expected);
        });
    });
});
