
import { listTagsFactory } from "./listTags";
import type { Octokit } from "@octokit/rest";
import { SemVer } from "../SemVer";

export function getLatestSemVersionedTagFactory(params: { octokit: Octokit; }) {

    const { octokit } = params;

    async function getLatestSemVersionedTag(
        params: { 
            owner: string; 
            repo: string; 
        }
    ): Promise<{ 
        tag: string; 
        version: SemVer; 
    } | undefined> {

        const { owner, repo } = params;

        const semVersionedTags: { tag: string; version: SemVer; }[] = [];

        const { listTags } = listTagsFactory({ octokit });

        for await (const tag of listTags({ owner, repo })) {

            const match = tag.match(/^v?([0-9]+\.[0-9]+\.[0-9]+)$/);

            if (!match) {
                continue;
            }

            semVersionedTags.push({
                tag,
                "version": SemVer.parse( match[1])
             });

        }

        return semVersionedTags
            .sort(({ version: vX }, { version: vY }) => SemVer.compare(vY, vX))[0];

    };

    return { getLatestSemVersionedTag };

}
