
import { run } from "../src/actions/prepare_release";

run({
    "actionParams": {
        "github_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "owner": "InseeFrLab",
        "repo": "onyxia",
        "sha": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "automatic_commit_author_email": "actions@github.com",
    },
    "core": {
        "debug": console.log,
    }
});

