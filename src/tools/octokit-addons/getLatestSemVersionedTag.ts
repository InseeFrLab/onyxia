
import { listTagsFactory } from "./listTags";
import type { Octokit } from "@octokit/rest";
import { SemVer } from "../SemVer";

export function getLatestSemVersionedTagFactory(params: { octokit: Octokit; }) {

    const { octokit } = params;

    async function getLatestSemVersionedTag(
        params: {
            owner: string;
            repo: string;
            rcPolicy: "ONLY LOOK FOR RC" | "IGNORE RC" | "RC OR REGULAR RELEASE";
            major: number | undefined;
        }
    ): Promise<{
        tag: string;
        version: SemVer;
    } | undefined> {

        const { owner, repo, rcPolicy, major } = params;

        const semVersionedTags: { tag: string; version: SemVer; }[] = [];

        const { listTags } = listTagsFactory({ octokit });

        for await (const tag of listTags({ owner, repo })) {

            let version: SemVer;

            try {

                version = SemVer.parse(tag.replace(/^[vV]?/, ""));

                if (major !== undefined && version.major !== major) {
                    continue;
                }

            } catch {
                continue;
            }

            switch (rcPolicy) {
                case "IGNORE RC":
                    if (version.rc !== undefined) {
                        continue;
                    }
                    break;
                case "ONLY LOOK FOR RC":
                    if (version.rc === undefined) {
                        continue;
                    }
                case "RC OR REGULAR RELEASE":
                    break;
            }

            semVersionedTags.push({ tag, version });

        }

        return semVersionedTags
            .sort(({ version: vX }, { version: vY }) => SemVer.compare(vY, vX))[0];

    };

    return { getLatestSemVersionedTag };

}
