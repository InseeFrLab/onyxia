import * as st from "scripting-tools";

export async function gitCommit(
    params: {
        owner: string;
        repo: string;
        commitAuthorEmail: string;
        performChanges: () => Promise<{ commit: false; } | { commit: true; addAll: boolean; message: string; }>;
        github_token: string;
    }
) {

    const { owner, repo, commitAuthorEmail, performChanges, github_token } = params;

    await st.exec(`git clone https://${github_token}@github.com/${owner}/${repo}`);

    const cwd = process.cwd();

    process.chdir(repo);

    const changesResult = await (async () => {

        try {

            return await performChanges();

        } catch (error) {

            return error as Error;

        }

    })()

    if (!(changesResult instanceof Error) && changesResult.commit) {

        await st.exec(`git config --local user.email "${commitAuthorEmail}"`);
        await st.exec(`git config --local user.name "${commitAuthorEmail.split("@")[0]}"`);

        if (changesResult.addAll) {

            await st.exec(`git add -A`);

        }

        await st.exec(`git commit -am "${changesResult.message}"`);

        await st.exec(`git push "https://${owner}:${github_token}@github.com/${owner}/${repo}.git"`);

    }

    process.chdir(cwd);

    await st.exec(`rm -r ${repo}`);

    if (changesResult instanceof Error) {
        throw changesResult;
    }

}