
import { run } from "../src/actions/assess_release_criteria";

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

