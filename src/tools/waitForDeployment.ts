import { createOctokit } from "./createOctokit";



export async function waitForDeployment (
    options: {
        token: string;
        environment: string;
        timeoutSeconds: number;
        sha: string;
        owner: string;
        repo: string;
        log: (message: string) => void;
    }
) {
  const {
    token,
    environment,
    timeoutSeconds,
    sha,
    owner,
    repo,
    log,
  } = options


  const octokit = createOctokit({ "github_token": token });

  const start = Date.now()

  const listDeploymentParams = {
    owner,
    repo,
    environment,
    sha
  };

  log(`Deployment params: ${JSON.stringify(listDeploymentParams, null, 2)}`)
  // throw new Error('DERP')

  while (true) {
    const { data: deployments } = await octokit.repos.listDeployments(listDeploymentParams)
    log(`Found ${deployments.length} deployments...`)

    for (const deployment of deployments) {
      log(`\tgetting statuses for deployment ${deployment.id}...`)

      const { data: statuses } = await octokit.request('GET /repos/:owner/:repo/deployments/:deployment/statuses', {
        owner,
        repo,
        "deployment": deployment.id
      })

      log(`\tfound ${statuses.length} statuses`)

      const [success] = statuses
        .filter((status: any) => status.state === 'success')
      if (success) {
        log(`\tsuccess! ${JSON.stringify(success, null, 2)}`)
        return {
          deployment,
          status: success,
          url: success.target_url
        }
      } else {
        log(`No statuses with state === "success": "${statuses.map((status: any) => status.state).join('", "')}"`)
      }

      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    const elapsed = (Date.now() - start) / 1000
    if (elapsed >= timeoutSeconds) {
      throw new Error(`Timing out after ${timeoutSeconds} seconds (${elapsed} elapsed)`)
    }
  }
}
